import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/finance.dto';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async createPayment(data: CreatePaymentDto): Promise<any> {
    return this.prisma.payment.create({ data });
  }

  async getPayments(): Promise<any> {
    return this.prisma.payment.findMany({
      include: {
        student: { include: { user: true } },
        guardian: { include: { user: true } },
        verifiedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyPayment(paymentId: string, adminUserId: string): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Find the payment and ensure it's not already verified
      const payment = await tx.payment.findUnique({ where: { id: paymentId } });
      if (!payment) {
        throw new NotFoundException(`Payment ${paymentId} not found`);
      }
      if (payment.status === 'VERIFIED') {
        throw new BadRequestException(
          `Payment ${paymentId} is already verified`,
        );
      }

      // 2. Mark payment as VERIFIED
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'VERIFIED',
          verifiedById: adminUserId,
        },
      });

      // 3. Create HourTransaction (PURCHASE)
      await tx.hourTransaction.create({
        data: {
          studentId: payment.studentId,
          amountMinutes: payment.packageMinutes,
          type: 'PURCHASE',
          description: `Hour package purchase via payment ${payment.id}`,
          paymentId: payment.id,
        },
      });

      // 4. Increment the student's remaining minutes
      await tx.studentProfile.update({
        where: { id: payment.studentId },
        data: {
          remainingMinutes: { increment: payment.packageMinutes },
        },
      });

      return updatedPayment;
    });
  }

  async getLedger(studentId: string): Promise<any> {
    return this.prisma.hourTransaction.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        payment: true,
        classSession: true,
      },
    });
  }
}
