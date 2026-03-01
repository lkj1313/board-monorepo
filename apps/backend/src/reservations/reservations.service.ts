import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async create(createReservationDto: CreateReservationDto, userId: number) {
    const { eventId, seatId } = createReservationDto;
    const holdKey = `seat:hold:${eventId}:${seatId}`;

    // 1. Redis에서 점유권 확인
    const heldBy = await this.redis.get(holdKey);

    if (!heldBy) {
      throw new ConflictException(
        '좌석 점유 시간이 만료되었거나 점유되지 않은 좌석입니다.',
      );
    }

    if (parseInt(heldBy) !== userId) {
      throw new ForbiddenException('본인이 점유한 좌석만 예약할 수 있습니다.');
    }

    // 2. DB 트랜잭션 (예약 생성 + 좌석 상태 변경)
    try {
      const reservation = await this.prisma.$transaction(async (tx) => {
        // 좌석 상태 체크 및 업데이트 (동시성 보장을 위해)
        const seat = await tx.seat.findUnique({
          where: { id: seatId },
        });

        if (!seat) {
          throw new NotFoundException('좌석 정보를 찾을 수 없습니다.');
        }

        if (seat.status !== 'AVAILABLE') {
          throw new ConflictException('이미 예약이 완료된 좌석입니다.');
        }

        // 예약 레코드 생성
        const newReservation = await tx.reservation.create({
          data: {
            seatId,
            userId,
          },
        });

        // 좌석 상태 변경
        await tx.seat.update({
          where: { id: seatId },
          data: { status: 'RESERVED' },
        });

        return newReservation;
      });

      // 3. 예약 성공 시 Redis 점유 해제
      await this.redis.del(holdKey);

      return reservation;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new ConflictException('예약 처리 중 오류가 발생했습니다.');
    }
  }

  findAll() {
    return this.prisma.reservation.findMany({
      include: {
        seat: true,
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  findOne(id: number) {
    return this.prisma.reservation.findUnique({
      where: { id },
      include: {
        seat: true,
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  update(id: number, updateReservationDto: UpdateReservationDto) {
    return this.prisma.reservation.update({
      where: { id },
      data: updateReservationDto,
    });
  }

  remove(id: number) {
    return this.prisma.reservation.delete({
      where: { id },
    });
  }
}
