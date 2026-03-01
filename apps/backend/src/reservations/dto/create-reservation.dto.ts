import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateReservationDto {
  @IsInt()
  @IsNotEmpty()
  eventId: number;

  @IsInt()
  @IsNotEmpty()
  seatId: number;
}
