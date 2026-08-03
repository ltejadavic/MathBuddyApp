import { Module } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { AvailabilityController } from './availability/availability.controller';
import { SessionsController } from './sessions/sessions.controller';
import { RequestsController } from './requests/requests.controller';

import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [SchedulingService],
  controllers: [AvailabilityController, SessionsController, RequestsController],
})
export class SchedulingModule {}
