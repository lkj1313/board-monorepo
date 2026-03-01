import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { SeatsModule } from './seats/seats.module';
import { ReservationsModule } from './reservations/reservations.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    PrismaModule,
    EventsModule,
    RedisModule.forRoot({
      type: 'single',
      url: 'redis://localhost:6379',
    }),
    SeatsModule,
    ReservationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
