import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { FinanceService } from '../finance.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@math-buddy/database';

@Controller('ledger')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LedgerController {
  constructor(private readonly financeService: FinanceService) {}

  @Get(':studentId')
  @Roles(Role.ADMIN, Role.GUARDIAN, Role.STUDENT)
  async getLedger(@Param('studentId') studentId: string): Promise<any> {
    return this.financeService.getLedger(studentId);
  }
}
