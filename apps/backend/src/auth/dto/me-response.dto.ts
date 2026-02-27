import { ApiProperty } from '@nestjs/swagger';

export class MeResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'test1@example.com' })
  email: string;

  @ApiProperty({ example: 'tester' })
  name: string;

  @ApiProperty({ example: '2026-02-27T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-02-27T12:30:00.000Z' })
  updatedAt: string;
}
