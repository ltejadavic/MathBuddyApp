import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FinanceService } from '../finance.service';
import { CreatePaymentDto } from '../dto/finance.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@math-buddy/database';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly financeService: FinanceService) {}

  @Post()
  @Roles(Role.ADMIN, Role.GUARDIAN)
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<any> {
    return this.financeService.createPayment(createPaymentDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  async getPayments(): Promise<any> {
    return this.financeService.getPayments();
  }

  @Post(':id/verify')
  @Roles(Role.ADMIN)
  async verifyPayment(@Param('id') id: string, @Req() req: any): Promise<any> {
    // req.user contains the authenticated admin from JWT
    const adminUserId = req.user.id;
    return this.financeService.verifyPayment(id, adminUserId);
  }
}
