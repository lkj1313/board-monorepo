import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSeatDto, CreateBulkSeatsDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class SeatsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  private getHoldKey(eventId: number, seatId: number): string {
    return `seat:hold:${eventId}:${seatId}`;
  }

  async holdSeat(eventId: number, seatId: number, userId: number) {
    // 1. DB에 해당 좌석이 존재하는지 확인
    const seat = await this.prisma.seat.findUnique({
      where: { id: seatId },
    });

    if (!seat || seat.eventId !== eventId) {
      throw new NotFoundException('해당 좌석을 찾을 수 없습니다.');
    }

    if (seat.status !== 'AVAILABLE') {
      throw new ConflictException('이미 예약되었거나 점유된 좌석입니다.');
    }

    // 2. Redis에 점유 정보 저장 (NX: 없으면 생성, EX 300: 5분 뒤 삭제)
    const key = this.getHoldKey(eventId, seatId);
    const result = await this.redis.set(
      key,
      userId.toString(),
      'EX',
      300,
      'NX',
    );

    if (result !== 'OK') {
      throw new ConflictException('이미 다른 사용자가 선택 중인 좌석입니다.');
    }

    return {
      message: '좌석이 5분간 점유되었습니다.',
      expiresAt: new Date(Date.now() + 300 * 1000),
    };
  }

  async releaseSeat(eventId: number, seatId: number) {
    const key = this.getHoldKey(eventId, seatId);
    await this.redis.del(key);
    return { message: '점유가 해제되었습니다.' };
  }

  async create(createSeatDto: CreateSeatDto) {
    // ... 기존 코드 유지
    return this.prisma.seat.create({
      data: {
        seatNumber: createSeatDto.seatNumber,
        eventId: createSeatDto.eventId,
        status: createSeatDto.status,
      },
    });
  }

  async createBulk(createBulkSeatsDto: CreateBulkSeatsDto) {
    const { eventId, seatNumbers } = createBulkSeatsDto;

    // 대량 생성 로직 (이미 생성된 좌석이 있는지 확인 후 일괄 삽입)
    const data = seatNumbers.map((seatNumber) => ({
      eventId,
      seatNumber,
    }));

    try {
      return await this.prisma.seat.createMany({
        data,
        skipDuplicates: true, // 중복된 좌석 번호가 있으면 건너뜀
      });
    } catch (error) {
      throw new ConflictException('좌석 생성 중 오류가 발생했습니다.');
    }
  }

  findAllByEvent(eventId: number) {
    return this.prisma.seat.findMany({
      where: { eventId },
      orderBy: { seatNumber: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.seat.findUnique({
      where: { id },
    });
  }

  update(id: number, updateSeatDto: UpdateSeatDto) {
    return this.prisma.seat.update({
      where: { id },
      data: updateSeatDto,
    });
  }

  remove(id: number) {
    return this.prisma.seat.delete({
      where: { id },
    });
  }
}
