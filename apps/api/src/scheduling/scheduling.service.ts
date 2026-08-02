import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAvailabilityDto,
  CreateSessionDto,
  UpdateSessionDto,
  UpdateAttendanceDto,
} from './dto/scheduling.dto';

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
}
