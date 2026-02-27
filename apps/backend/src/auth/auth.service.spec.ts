import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('signup throws ConflictException when email already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 1 });

    await expect(
      service.signup({
        email: 'test@example.com',
        password: '123456',
        name: 'tester',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('signup creates user and stores refreshToken hash', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    (bcrypt.hash as jest.Mock)
      .mockResolvedValueOnce('hashed-password')
      .mockResolvedValueOnce('hashed-refresh-token');

    prismaMock.user.create.mockResolvedValueOnce({
      id: 1,
      email: 'test@example.com',
      name: 'tester',
    });
    jwtServiceMock.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.signup({
      email: 'test@example.com',
      password: '123456',
      name: 'tester',
    });

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'tester',
      },
    });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { refreshTokenHash: 'hashed-refresh-token' },
    });
    expect(result).toEqual({
      user: { id: 1, email: 'test@example.com', name: 'tester' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('login throws UnauthorizedException when user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.login({ email: 'none@example.com', password: '123456' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login throws UnauthorizedException when password mismatch', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1,
      email: 'test@example.com',
      password: 'hashed-password',
      name: 'tester',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

    await expect(
      service.login({ email: 'test@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login returns access/refresh tokens when credentials are valid', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1,
      email: 'test@example.com',
      password: 'hashed-password',
      name: 'tester',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-refresh-token');
    jwtServiceMock.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.login({
      email: 'test@example.com',
      password: '123456',
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { refreshTokenHash: 'hashed-refresh-token' },
    });
    expect(result).toEqual({
      user: { id: 1, email: 'test@example.com', name: 'tester' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('refresh returns new token pair when refresh token is valid', async () => {
    jwtServiceMock.verifyAsync.mockResolvedValueOnce({
      sub: 1,
      email: 'test@example.com',
    });
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1,
      email: 'test@example.com',
      name: 'tester',
      refreshTokenHash: 'stored-hash',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    (bcrypt.hash as jest.Mock).mockResolvedValueOnce('next-hash');
    jwtServiceMock.signAsync
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');

    const result = await service.refresh('old-refresh-token');

    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token');
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { refreshTokenHash: 'next-hash' },
    });
  });

  it('refresh throws UnauthorizedException when refresh token is invalid', async () => {
    jwtServiceMock.verifyAsync.mockRejectedValueOnce(new Error('invalid'));

    await expect(service.refresh('bad-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
