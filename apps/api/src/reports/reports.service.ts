import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminDashboardMetrics() {
    const totalPayments = await this.prisma.payment.aggregate({
      _sum: {
        amountCents: true,
      },
      where: {
        status: 'VERIFIED',
      },
    });

    const activeStudents = await this.prisma.user.count({
      where: {
        role: 'STUDENT',
        deletedAt: null,
      },
    });

    const activeTeachers = await this.prisma.user.count({
      where: {
        role: 'TEACHER',
        deletedAt: null,
      },
    });

    const totalHoursTransacted = await this.prisma.hourTransaction.aggregate({
      _sum: {
        amountMinutes: true,
      },
      where: {
        type: 'PURCHASE',
      },
    });

    return {
      totalRevenueCents: totalPayments._sum.amountCents || 0,
      activeStudents,
      activeTeachers,
      totalHoursPurchased: (totalHoursTransacted._sum.amountMinutes || 0) / 60,
    };
  }

  async getTeacherDashboardMetrics(userId: string) {
    const teacherProfile = await this.prisma.teacherProfile.findUnique({
      where: { userId },
    });
    if (!teacherProfile) return null;

    const upcomingClasses = await this.prisma.classSession.findMany({
      where: {
        teacherId: teacherProfile.id,
        scheduledStartTime: { gte: new Date() },
        status: 'SCHEDULED',
      },
      orderBy: { scheduledStartTime: 'asc' },
      take: 5,
      include: {
        course: true,
      },
    });

    const pendingEarnings = await this.prisma.teacherEarning.aggregate({
      _sum: {
        amountCents: true,
      },
      where: {
        teacherId: teacherProfile.id,
        status: 'PENDING_PAYOUT',
      },
    });

    const totalEarnings = await this.prisma.teacherEarning.aggregate({
      _sum: {
        amountCents: true,
      },
      where: {
        teacherId: teacherProfile.id,
      },
    });

    return {
      upcomingClasses,
      pendingEarningsCents: pendingEarnings._sum.amountCents || 0,
      totalEarningsCents: totalEarnings._sum.amountCents || 0,
    };
  }

  async getStudentDashboardMetrics(userId: string) {
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!studentProfile) return null;

    const upcomingClasses = await this.prisma.classAttendance.findMany({
      where: {
        studentId: studentProfile.id,
        classSession: {
          scheduledStartTime: { gte: new Date() },
          status: 'SCHEDULED',
        },
      },
      include: {
        classSession: {
          include: { course: true, teacher: { include: { user: true } } },
        },
      },
      orderBy: {
        classSession: { scheduledStartTime: 'asc' },
      },
      take: 5,
    });

    const recentSummaries = await this.prisma.classSummary.findMany({
      where: { studentId: studentProfile.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        classSession: { include: { course: true } },
      },
    });

    return {
      remainingMinutes: studentProfile.remainingMinutes,
      remainingHours: (studentProfile.remainingMinutes / 60).toFixed(2),
      upcomingClasses,
      recentSummaries,
    };
  }
}
