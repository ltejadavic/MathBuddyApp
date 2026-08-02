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

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    SchedulingModule,
    FinanceModule,
    ChatModule,
    AcademicModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
