import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEventDto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        title: createEventDto.title,
        date: new Date(createEventDto.date),
      },
    });
  }

  findAll() {
    return this.prisma.event.findMany({
      orderBy: { date: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.event.findUnique({
      where: { id },
      include: {
        seats: {
          orderBy: { seatNumber: 'asc' },
        },
      },
    });
  }

  update(id: number, updateEventDto: UpdateEventDto) {
    return this.prisma.event.update({
      where: { id },
      data: {
        ...updateEventDto,
        date: updateEventDto.date ? new Date(updateEventDto.date) : undefined,
      },
    });
  }

  remove(id: number) {
    return this.prisma.event.delete({
      where: { id },
    });
  }
}
