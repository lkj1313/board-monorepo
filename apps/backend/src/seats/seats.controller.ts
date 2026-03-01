import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { SeatsService } from './seats.service';
import { CreateSeatDto, CreateBulkSeatsDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Post()
  create(@Body() createSeatDto: CreateSeatDto) {
    return this.seatsService.create(createSeatDto);
  }

  @Post('bulk')
  createBulk(@Body() createBulkSeatsDto: CreateBulkSeatsDto) {
    return this.seatsService.createBulk(createBulkSeatsDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/hold')
  holdSeat(
    @Param('id', ParseIntPipe) id: number,
    @Body('eventId', ParseIntPipe) eventId: number,
    @GetUser('userId') userId: number,
  ) {
    return this.seatsService.holdSeat(eventId, id, userId);
  }

  @Get('event/:eventId')
  findAllByEvent(@Param('eventId', ParseIntPipe) eventId: number) {
    return this.seatsService.findAllByEvent(eventId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.seatsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSeatDto: UpdateSeatDto) {
    return this.seatsService.update(+id, updateSeatDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.seatsService.remove(+id);
  }
}
