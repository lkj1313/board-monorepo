import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { SeatStatus } from '@prisma/client';
import type { SeatStatus as SharedSeatStatus } from '@reservation/shared-types';

export class CreateSeatDto {
  @IsString()
  @IsNotEmpty()
  seatNumber: string;

  @IsInt()
  @IsNotEmpty()
  eventId: number;

  @IsOptional()
  @IsEnum(SeatStatus)
  status?: SharedSeatStatus;
}

export class CreateBulkSeatsDto {
  @IsInt()
  @IsNotEmpty()
  eventId: number;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  seatNumbers: string[];
}
