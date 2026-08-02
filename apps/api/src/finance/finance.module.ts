import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { PaymentsController } from './payments/payments.controller';
import { LedgerController } from './ledger/ledger.controller';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FinanceService],
  controllers: [PaymentsController, LedgerController],
})
export class FinanceModule {}
