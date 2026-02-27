import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { SignupRequest } from '@board/shared-types';

export class SignupDto implements SignupRequest {
  @ApiProperty({ example: 'test1@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'tester', minLength: 1 })
  @IsString()
  @MinLength(1)
  name: string;
}
