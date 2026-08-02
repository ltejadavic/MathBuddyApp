import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CatalogModule } from './catalog/catalog.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { FinanceModule } from './finance/finance.module';
import { ChatModule } from './chat/chat.module';
import { AcademicModule } from './academic/academic.module';
import { StorageModule } from './storage/storage.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    SchedulingModule,
    FinanceModule,
    ChatModule,
    AcademicModule,
    StorageModule,
    NotificationsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
