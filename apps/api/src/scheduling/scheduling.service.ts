import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAvailabilityDto,
  CreateSessionDto,
  UpdateSessionDto,
  UpdateAttendanceDto,
} from './dto/scheduling.dto';
import { CompleteSessionDto } from './dto/complete-session.dto';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class SchedulingService {
  constructor(private prisma: PrismaService) {}

  // Availability
  async createAvailability(data: CreateAvailabilityDto): Promise<any> {
    return this.prisma.teacherAvailability.create({ data });
  }

  async getAvailability(teacherId: string): Promise<any> {
    return this.prisma.teacherAvailability.findMany({
      where: { teacherId },
    });
  }

  // Sessions
  async createSession(data: CreateSessionDto): Promise<any> {
    // Also fetch all students enrolled in the course to create their attendance records
    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId: data.courseId, status: 'ACTIVE' },
    });

    const session = await this.prisma.classSession.create({
      data: {
        courseId: data.courseId,
        teacherId: data.teacherId,
        scheduledStartTime: new Date(data.scheduledStartTime),
        scheduledEndTime: new Date(data.scheduledEndTime),
        meetingLink: data.meetingLink,
        notes: data.notes,
        attendances: {
          create: enrollments.map((e) => ({
            studentId: e.studentId,
            status: 'EXPECTED',
          })),
        },
      },
      include: {
        attendances: true,
      },
    });

    return session;
  }

  async getSessions(): Promise<any> {
    return this.prisma.classSession.findMany({
      include: {
        teacher: { include: { user: true } },
        course: true,
        attendances: { include: { student: { include: { user: true } } } },
      },
    });
  }

  async getSession(id: string): Promise<any> {
    const session = await this.prisma.classSession.findUnique({
      where: { id },
      include: {
        teacher: { include: { user: true } },
        course: true,
        attendances: { include: { student: { include: { user: true } } } },
      },
    });

    if (!session) {
      throw new NotFoundException(`ClassSession with ID ${id} not found`);
    }
    return session;
  }

  async updateSession(id: string, data: UpdateSessionDto): Promise<any> {
    const updateData: any = { ...data };

    if (data.scheduledStartTime) {
      updateData.scheduledStartTime = new Date(data.scheduledStartTime);
    }
    if (data.scheduledEndTime) {
      updateData.scheduledEndTime = new Date(data.scheduledEndTime);
    }

    return this.prisma.classSession.update({
      where: { id },
      data: updateData,
    });
  }

  async updateAttendance(
    sessionId: string,
    data: UpdateAttendanceDto,
  ): Promise<any> {
    // Find the unique class attendance record
    const attendance = await this.prisma.classAttendance.findUnique({
      where: {
        classSessionId_studentId: {
          classSessionId: sessionId,
          studentId: data.studentId,
        },
      },
    });

    if (!attendance) {
      throw new NotFoundException(
        `Attendance record not found for student in session`,
      );
    }

    return this.prisma.classAttendance.update({
      where: { id: attendance.id },
      data: { status: data.status },
    });
  }

  async completeSession(
    sessionId: string,
    data: CompleteSessionDto,
  ): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate session
      const session = await tx.classSession.findUnique({
        where: { id: sessionId },
        include: { teacher: true, attendances: true },
      });

      if (!session) {
        throw new NotFoundException(`Session ${sessionId} not found`);
      }
      if (session.status === 'COMPLETED') {
        throw new BadRequestException(
          `Session ${sessionId} is already completed`,
        );
      }

      // 2. Update session status and times
      const updatedSession = await tx.classSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          actualStartTime: new Date(data.actualStartTime),
          actualEndTime: new Date(data.actualEndTime),
        },
      });

      // 3. Process attendances and hours
      for (const attDto of data.attendances) {
        const attendance = session.attendances.find(
          (a) => a.studentId === attDto.studentId,
        );
        if (!attendance) {
          throw new BadRequestException(
            `Student ${attDto.studentId} is not enrolled in this session`,
          );
        }

        // Update attendance status
        await tx.classAttendance.update({
          where: { id: attendance.id },
          data: { status: attDto.status },
        });

        // Deduct hours if applicable (PRESENT or ABSENT_NO_SHOW)
        if (attDto.status === 'PRESENT' || attDto.status === 'ABSENT_NO_SHOW') {
          await tx.hourTransaction.create({
            data: {
              studentId: attDto.studentId,
              amountMinutes: -data.actualDurationMinutes,
              type: 'CONSUMPTION',
              description: `Class consumption for session ${sessionId} (${attDto.status})`,
              classSessionId: sessionId,
            },
          });

          await tx.studentProfile.update({
            where: { id: attDto.studentId },
            data: {
              remainingMinutes: { decrement: data.actualDurationMinutes },
            },
          });
        }
      }

      // 4. Generate Teacher Earnings
      const earningCents = Math.round(
        (session.teacher.hourlyRateCents / 60) * data.actualDurationMinutes,
      );

      await tx.teacherEarning.create({
        data: {
          teacherId: session.teacherId,
          classSessionId: sessionId,
          amountCents: earningCents,
          currency: session.teacher.currency,
          status: 'PENDING_PAYOUT',
        },
      });

      return updatedSession;
    });
  }
}
