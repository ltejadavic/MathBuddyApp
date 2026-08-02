import { Module } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { AvailabilityController } from './availability/availability.controller';
import { SessionsController } from './sessions/sessions.controller';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SchedulingService],
  controllers: [AvailabilityController, SessionsController],
})
export class SchedulingModule {}
