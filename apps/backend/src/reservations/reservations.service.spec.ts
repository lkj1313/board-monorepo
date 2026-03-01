import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '../prisma/prisma.service';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prisma: PrismaService;
  let redis: any;

  const mockPrisma = {
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrisma)),
    seat: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    reservation: {
      create: jest.fn(),
    },
  };

  const mockRedis = {
    get: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: getRedisConnectionToken(),
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get(getRedisConnectionToken());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = { eventId: 1, seatId: 10 };
    const userId = 999;
    const holdKey = `seat:hold:${dto.eventId}:${dto.seatId}`;

    it('성공: 점유권이 있고 좌석이 비어있으면 예약에 성공한다', async () => {
      // 1. Redis 점유 확인 Mock
      mockRedis.get.mockResolvedValue(userId.toString());

      // 2. DB 좌석 확인 Mock
      mockPrisma.seat.findUnique.mockResolvedValue({
        id: dto.seatId,
        status: 'AVAILABLE',
      });

      // 3. 예약 생성 및 업데이트 Mock
      mockPrisma.reservation.create.mockResolvedValue({
        id: 100,
        ...dto,
        userId,
      });
      mockPrisma.seat.update.mockResolvedValue({
        id: dto.seatId,
        status: 'RESERVED',
      });

      const result = await service.create(dto, userId);

      expect(result).toBeDefined();
      expect(result.userId).toBe(userId);
      expect(mockRedis.del).toHaveBeenCalledWith(holdKey);
    });

    it('실패: Redis에 점유 정보가 없으면 ConflictException을 던진다', async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(service.create(dto, userId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('실패: 다른 유저가 점유 중이면 ForbiddenException을 던진다', async () => {
      mockRedis.get.mockResolvedValue('888'); // 다른 유저 ID

      await expect(service.create(dto, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('실패: DB에 좌석이 없으면 NotFoundException을 던진다', async () => {
      mockRedis.get.mockResolvedValue(userId.toString());
      mockPrisma.seat.findUnique.mockResolvedValue(null);

      await expect(service.create(dto, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('실패: 좌석이 이미 예약된 상태면 ConflictException을 던진다', async () => {
      mockRedis.get.mockResolvedValue(userId.toString());
      mockPrisma.seat.findUnique.mockResolvedValue({
        id: dto.seatId,
        status: 'RESERVED',
      });

      await expect(service.create(dto, userId)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
