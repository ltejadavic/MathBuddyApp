import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateAvailabilityDto,
  CreateSessionDto,
  UpdateSessionDto,
  UpdateAttendanceDto,
  UpdateBulkAvailabilityDto,
  UpdateBulkStudentAvailabilityDto,
  CreateClassRequestDto,
  ResolveClassRequestDto,
  EditScheduleDto,
  ScheduleMatchedClassesDto,
} from './dto/scheduling.dto';
import { CompleteSessionDto } from './dto/complete-session.dto';

@Injectable()
export class SchedulingService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // Availability
  async createAvailability(data: CreateAvailabilityDto): Promise<any> {
    return this.prisma.teacherAvailability.create({ data });
  }

  async getAvailability(teacherId: string): Promise<any> {
    const profile = await this.prisma.teacherProfile.findFirst({
      where: { OR: [{ id: teacherId }, { userId: teacherId }] },
    });
    if (!profile) throw new NotFoundException('Teacher profile not found');

    return this.prisma.teacherAvailability.findMany({
      where: { teacherId: profile.id },
    });
  }

  async updateAvailability(
    userId: string,
    data: UpdateBulkAvailabilityDto,
  ): Promise<any> {
    const profile = await this.prisma.teacherProfile.findFirst({
      where: { OR: [{ id: userId }, { userId: userId }] },
    });
    if (!profile) throw new NotFoundException('Teacher profile not found');

    return this.prisma.$transaction(async (tx) => {
      // Delete all existing availabilities for this teacher
      await tx.teacherAvailability.deleteMany({
        where: { teacherId: profile.id },
      });
      // Create new ones if provided
      if (data.slots && data.slots.length > 0) {
        await tx.teacherAvailability.createMany({
          data: data.slots.map((slot: any) => ({
            teacherId: profile.id,
            date: new Date(slot.date),
            startTime: slot.startTime,
            endTime: slot.endTime,
            timeZone: slot.timeZone,
          })),
        });
      }
      return { success: true };
    });
  }

  async updateStudentAvailability(
    userId: string,
    data: UpdateBulkStudentAvailabilityDto,
  ): Promise<any> {
    const profile = await this.prisma.studentProfile.findFirst({
      where: { OR: [{ id: userId }, { userId: userId }] },
    });
    if (!profile) throw new NotFoundException('Student profile not found');

    return this.prisma.$transaction(async (tx) => {
      // Delete all existing availabilities for this student
      await tx.studentAvailability.deleteMany({
        where: { studentId: profile.id },
      });
      // Create new ones if provided
      if (data.slots && data.slots.length > 0) {
        await tx.studentAvailability.createMany({
          data: data.slots.map((slot: any) => ({
            studentId: profile.id,
            date: new Date(slot.date),
            startTime: slot.startTime,
            endTime: slot.endTime,
            timeZone: slot.timeZone,
          })),
        });
      }
      return { success: true };
    });
  }

  async getStudentAvailability(studentId: string): Promise<any> {
    const profile = await this.prisma.studentProfile.findFirst({
      where: { OR: [{ id: studentId }, { userId: studentId }] },
    });
    if (!profile) throw new NotFoundException('Student profile not found');

    return this.prisma.studentAvailability.findMany({
      where: { studentId: profile.id },
    });
  }

  async getMatchmakingAvailability(
    studentId: string,
    teacherId: string,
  ): Promise<any> {
    const student = await this.prisma.studentProfile.findFirst({
      where: { OR: [{ id: studentId }, { userId: studentId }] },
    });
    const teacher = await this.prisma.teacherProfile.findFirst({
      where: { OR: [{ id: teacherId }, { userId: teacherId }] },
    });
    if (!student || !teacher) throw new NotFoundException('Profile not found');

    const studentAvail = await this.prisma.studentAvailability.findMany({
      where: { studentId: student.id },
    });
    const teacherAvail = await this.prisma.teacherAvailability.findMany({
      where: { teacherId: teacher.id },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const studentSessions = await this.prisma.classSession.findMany({
      where: {
        attendances: {
          some: {
            studentId: student.id,
            status: { in: ['EXPECTED', 'ATTENDED'] },
          },
        },
        scheduledStartTime: { gte: today },
        status: { not: 'CANCELLED' },
      },
      select: {
        scheduledStartTime: true,
        scheduledEndTime: true,
        course: { select: { name: true } },
      },
    });

    const teacherSessions = await this.prisma.classSession.findMany({
      where: {
        teacherId: teacher.id,
        scheduledStartTime: { gte: today },
        status: { not: 'CANCELLED' },
      },
      select: { scheduledStartTime: true, scheduledEndTime: true },
    });

    return {
      studentAvailability: studentAvail,
      teacherAvailability: teacherAvail,
      studentSessions,
      teacherSessions,
    };
  }

  // Requests
  async createClassRequest(data: CreateClassRequestDto): Promise<any> {
    const student = await this.prisma.studentProfile.findFirst({
      where: { OR: [{ id: data.studentId }, { userId: data.studentId }] },
      include: { user: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    const course = await this.prisma.course.findUnique({
      where: { id: data.courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    const request = await this.prisma.classRequest.create({
      data: {
        studentId: student.id,
        courseId: data.courseId,
        notes: data.notes,
        status: 'PENDING',
      },
    });

    // Notify all admins
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
    });
    for (const admin of admins) {
      await this.notificationsService.create({
        userId: admin.id,
        type: 'CLASS_REQUEST',
        title: 'New Class Request',
        message: `${student.user.firstName} ${student.user.lastName} requested classes for ${course.name}.`,
      });
    }

    return request;
  }

  async getClassRequests(query: {
    status?: string;
    studentId?: string;
  }): Promise<any> {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.studentId) where.studentId = query.studentId;

    return this.prisma.classRequest.findMany({
      where,
      include: {
        student: { include: { user: true } },
        course: { include: { program: true } },
        resolvedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveClassRequest(
    id: string,
    data: ResolveClassRequestDto,
  ): Promise<any> {
    const req = await this.prisma.classRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Request not found');

    return this.prisma.classRequest.update({
      where: { id },
      data: {
        status: data.status,
        resolvedById: data.resolvedById,
      },
    });
  }

  async scheduleMatchedClasses(data: ScheduleMatchedClassesDto): Promise<any> {
    const student = await this.prisma.studentProfile.findFirst({
      where: { OR: [{ id: data.studentId }, { userId: data.studentId }] },
      include: { user: true },
    });
    const teacher = await this.prisma.teacherProfile.findFirst({
      where: { OR: [{ id: data.teacherId }, { userId: data.teacherId }] },
      include: { user: true },
    });
    const course = await this.prisma.course.findUnique({
      where: { id: data.courseId },
    });

    if (!student || !teacher || !course) {
      throw new NotFoundException('Profile or Course not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Verify active hour packages have enough minutes
      if (student.remainingMinutes < data.totalMinutesToConsume) {
        throw new BadRequestException(
          `Insufficient purchased hours in the Student's Profile. Need ${data.totalMinutesToConsume / 60}h but only ${student.remainingMinutes / 60}h available.`,
        );
      }

      // 2. Consume hours across packages
      await tx.studentProfile.update({
        where: { id: student.id },
        data: {
          remainingMinutes:
            student.remainingMinutes - data.totalMinutesToConsume,
        },
      });

      await tx.hourTransaction.create({
        data: {
          studentId: student.id,
          type: 'CONSUMPTION',
          amountMinutes: data.totalMinutesToConsume,
          description: `Scheduled classes for ${course.name}`,
        },
      });

      // 3. Create Sessions
      const sessions = [];
      const groupId = crypto.randomUUID();
      for (const slot of data.slots) {
        const startTime = new Date(`${slot.date}T${slot.startTime}:00`);
        const endTime = new Date(`${slot.date}T${slot.endTime}:00`);

        const studentConflict = await tx.classSession.findFirst({
          where: {
            attendances: {
              some: {
                studentId: student.id,
                status: { in: ['EXPECTED', 'ATTENDED'] },
              },
            },
            status: { not: 'CANCELLED' },
            scheduledStartTime: { lt: endTime },
            scheduledEndTime: { gt: startTime },
          },
        });
        if (studentConflict) {
          throw new BadRequestException(
            `Student is already scheduled for a class at ${slot.date} ${slot.startTime}.`,
          );
        }

        const teacherConflict = await tx.classSession.findFirst({
          where: {
            teacherId: teacher.id,
            status: { not: 'CANCELLED' },
            scheduledStartTime: { lt: endTime },
            scheduledEndTime: { gt: startTime },
          },
        });
        if (teacherConflict) {
          throw new BadRequestException(
            `Teacher is already scheduled for a class at ${slot.date} ${slot.startTime}.`,
          );
        }

        const session = await tx.classSession.create({
          data: {
            courseId: course.id,
            teacherId: teacher.id,
            scheduledStartTime: startTime,
            scheduledEndTime: endTime,
            status: 'SCHEDULED',
            scheduleGroupId: groupId,
            attendances: {
              create: [
                {
                  studentId: student.id,
                  status: 'EXPECTED',
                },
              ],
            },
          },
        });
        sessions.push(session);
      }

      // 4. Resolve Request if provided
      if (data.classRequestId) {
        await tx.classRequest.update({
          where: { id: data.classRequestId },
          data: { status: 'RESOLVED' }, // the admin id who resolved it could be taken from auth context ideally
        });
      }

      // 5. Notifications
      await tx.notification.create({
        data: {
          userId: student.userId,
          type: 'CLASS_SCHEDULED',
          title: 'Classes Scheduled',
          message: `${data.slots.length} class(es) have been scheduled for ${course.name}.`,
        },
      });
      await tx.notification.create({
        data: {
          userId: teacher.userId,
          type: 'CLASS_SCHEDULED',
          title: 'New Classes Assigned',
          message: `You have been assigned to teach ${data.slots.length} new class(es) for ${course.name}.`,
        },
      });

      return { success: true, count: sessions.length };
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

  async getSessions(query?: {
    studentId?: string;
    teacherId?: string;
  }): Promise<any> {
    const where: any = {};
    if (query?.teacherId) {
      const teacherProfile = await this.prisma.teacherProfile.findFirst({
        where: { OR: [{ id: query.teacherId }, { userId: query.teacherId }] },
      });
      where.teacherId = teacherProfile ? teacherProfile.id : query.teacherId;
    }
    if (query?.studentId) {
      const studentProfile = await this.prisma.studentProfile.findFirst({
        where: { OR: [{ id: query.studentId }, { userId: query.studentId }] },
      });
      where.attendances = {
        some: {
          studentId: studentProfile ? studentProfile.id : query.studentId,
        },
      };
    }

    return this.prisma.classSession.findMany({
      where,
      include: {
        teacher: { include: { user: true } },
        course: { include: { program: true } },
        attendances: { include: { student: { include: { user: true } } } },
      },
      orderBy: { scheduledStartTime: 'asc' },
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

  async getSchedules(studentId: string, teacherId?: string, reqUser?: any): Promise<any> {
    const student = await this.prisma.studentProfile.findFirst({
      where: { OR: [{ id: studentId }, { userId: studentId }] },
    });
    if (!student) return [];

    if (reqUser?.role === 'TEACHER') {
      const teacherProfile = await this.prisma.teacherProfile.findUnique({
        where: { userId: reqUser.sub || reqUser.id },
      });
      if (!teacherProfile) throw new ForbiddenException('Teacher profile not found');

      const hasRelationship = await this.prisma.classAttendance.findFirst({
        where: {
          studentId: student.id,
          classSession: {
            teacherId: teacherProfile.id,
          },
        },
      });

      if (!hasRelationship) {
        throw new ForbiddenException("You do not have permission to view this student's schedules");
      }
    }

    let teacher = null;
    if (teacherId) {
      teacher = await this.prisma.teacherProfile.findFirst({
        where: { OR: [{ id: teacherId }, { userId: teacherId }] },
      });
      if (!teacher) return [];
    }

    const whereClause: any = {
      attendances: { some: { studentId: student.id } },
    };
    if (teacher) {
      whereClause.teacherId = teacher.id;
    }

    // Find all sessions for this combo
    const sessions = await this.prisma.classSession.findMany({
      where: whereClause,
      include: {
        course: { include: { program: true } },
        teacher: { include: { user: true } },
      },
      orderBy: { scheduledStartTime: 'asc' },
    });

    // Group by scheduleGroupId (fallback to course+teacher if null)
    const map = new Map<string, any>();
    for (const session of sessions) {
      const key =
        session.scheduleGroupId || `${session.courseId}-${session.teacherId}`;
      if (!map.has(key)) {
        map.set(key, {
          scheduleGroupId: session.scheduleGroupId,
          course: session.course,
          teacher: session.teacher,
          totalMinutes: 0,
          sessions: [],
        });
      }
      const group = map.get(key);
      const start = new Date(session.scheduledStartTime).getTime();
      const end = new Date(session.scheduledEndTime).getTime();
      group.totalMinutes += (end - start) / (1000 * 60);
      group.sessions.push(session);
    }

    return Array.from(map.values());
  }

  async updateSchedule(
    courseId: string,
    data: EditScheduleDto,
    reqUser?: any,
  ): Promise<any> {
    const student = await this.prisma.studentProfile.findFirst({
      where: { OR: [{ id: data.studentId }, { userId: data.studentId }] },
      include: { user: true },
    });
    const teacher = await this.prisma.teacherProfile.findFirst({
      where: { OR: [{ id: data.teacherId }, { userId: data.teacherId }] },
      include: { user: true },
    });

    if (!student || !teacher) throw new NotFoundException('Profile not found');

    if (reqUser?.role === 'TEACHER' && teacher.userId !== (reqUser.sub || reqUser.id)) {
      throw new BadRequestException('You can only edit your own schedules');
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    const isTeacherEdit = reqUser?.role === 'TEACHER';

    const result = await this.prisma.$transaction(async (tx) => {
      // Find all FUTURE SCHEDULED sessions for this combination and group
      const existingSessions = await tx.classSession.findMany({
        where: {
          courseId,
          teacherId: teacher.id,
          scheduleGroupId: data.scheduleGroupId || null,
          status: 'SCHEDULED',
          scheduledStartTime: { gt: new Date() },
          attendances: { some: { studentId: student.id } },
        },
      });

      const oldTotalMinutes = existingSessions.reduce((acc, sess) => {
        return (
          acc +
          (new Date(sess.scheduledEndTime).getTime() -
            new Date(sess.scheduledStartTime).getTime()) /
            (1000 * 60)
        );
      }, 0);

      const newTotalMinutes = data.slots.reduce((acc, slot) => {
        const s = new Date(`2000-01-01T${slot.startTime}:00`).getTime();
        const e = new Date(`2000-01-01T${slot.endTime}:00`).getTime();
        return acc + (e - s) / (1000 * 60);
      }, 0);

      // Removed unused course retrieval

      const diffMinutes = oldTotalMinutes - newTotalMinutes;
      if (diffMinutes !== 0) {
        if (diffMinutes < 0) {
          // Added more hours
          const added = Math.abs(diffMinutes);
          if (student.remainingMinutes < added) {
            throw new BadRequestException(
              `Not enough balance to add ${added / 60}h. Need ${added / 60}h, have ${student.remainingMinutes / 60}h.`,
            );
          }
          await tx.studentProfile.update({
            where: { id: student.id },
            data: { remainingMinutes: { decrement: added } },
          });
          await tx.hourTransaction.create({
            data: {
              studentId: student.id,
              amountMinutes: -added,
              type: 'CONSUME',
              description: `${isTeacherEdit ? 'Teacher' : 'Admin'} edit (added ${added / 60}h to schedule)`,
            },
          });
        } else {
          // Removed hours
          await tx.studentProfile.update({
            where: { id: student.id },
            data: { remainingMinutes: { increment: diffMinutes } },
          });
          await tx.hourTransaction.create({
            data: {
              studentId: student.id,
              amountMinutes: diffMinutes,
              type: 'REFUND',
              description: `${isTeacherEdit ? 'Teacher' : 'Admin'} edit (refunded ${diffMinutes / 60}h from schedule)`,
            },
          });
        }
      }

      // Delete the existing future ones
      const sessionIds = existingSessions.map((s) => s.id);
      if (sessionIds.length > 0) {
        await tx.classAttendance.deleteMany({
          where: { classSessionId: { in: sessionIds } },
        });
        await tx.classSession.deleteMany({ where: { id: { in: sessionIds } } });
      }

      // Create new ones
      const createdSessions = [];
      for (const slot of data.slots) {
        const session = await tx.classSession.create({
          data: {
            courseId: courseId,
            teacherId: teacher.id,
            scheduledStartTime: new Date(`${slot.date}T${slot.startTime}:00`),
            scheduledEndTime: new Date(`${slot.date}T${slot.endTime}:00`),
            status: 'SCHEDULED',
            scheduleGroupId: data.scheduleGroupId,
            attendances: {
              create: [{ studentId: student.id, status: 'EXPECTED' }],
            },
          },
        });
        createdSessions.push(session);
      }

      if (isTeacherEdit) {
        await tx.classRequest.create({
          data: {
            studentId: student.id,
            courseId: courseId,
            status: 'EDITED',
            notes: `[TEACHER_EDIT] Teacher ${teacher.user.firstName} ${teacher.user.lastName} modified the schedule for ${course?.name || 'course'}.`,
            resolvedById: reqUser.sub || reqUser.id,
          },
        });
      }

      return { success: true, recreatedCount: createdSessions.length };
    });

    // Notify Student
    await this.notificationsService.create({
      userId: student.userId,
      type: 'SYSTEM',
      title: 'Schedule Updated',
      message: 'Your class schedule has been updated.',
    });

    // Notify Teacher
    await this.notificationsService.create({
      userId: teacher.userId,
      type: 'SYSTEM',
      title: 'Schedule Updated',
      message: 'A class schedule has been updated.',
    });

    return result;
  }

  async deleteSchedule(
    courseId: string,
    studentId: string,
    teacherId: string,
    scheduleGroupId: string,
    reqUser?: any,
  ): Promise<any> {
    const student = await this.prisma.studentProfile.findFirst({
      where: { OR: [{ id: studentId }, { userId: studentId }] },
    });
    const teacher = await this.prisma.teacherProfile.findFirst({
      where: { OR: [{ id: teacherId }, { userId: teacherId }] },
      include: { user: true },
    });

    if (!student || !teacher) throw new NotFoundException('Profile not found');

    if (reqUser?.role === 'TEACHER' && teacher.userId !== (reqUser.sub || reqUser.id)) {
      throw new BadRequestException('You can only delete your own schedules');
    }

    const isTeacherEdit = reqUser?.role === 'TEACHER';

    const result = await this.prisma.$transaction(async (tx) => {
      // Find all FUTURE SCHEDULED sessions
      const existingSessions = await tx.classSession.findMany({
        where: {
          courseId,
          teacherId: teacher.id,
          scheduleGroupId: scheduleGroupId || null,
          status: 'SCHEDULED',
          scheduledStartTime: { gt: new Date() },
          attendances: { some: { studentId: student.id } },
        },
      });

      if (existingSessions.length === 0) {
        throw new BadRequestException(
          'Cannot delete a completed package or a package with no future sessions.',
        );
      }

      const totalMinutes = existingSessions.reduce((acc, sess) => {
        return (
          acc +
          (new Date(sess.scheduledEndTime).getTime() -
            new Date(sess.scheduledStartTime).getTime()) /
            (1000 * 60)
        );
      }, 0);

      // Delete them
      const sessionIds = existingSessions.map((s) => s.id);
      await tx.classAttendance.deleteMany({
        where: { classSessionId: { in: sessionIds } },
      });
      await tx.classSession.deleteMany({ where: { id: { in: sessionIds } } });

      // Refund
      await tx.studentProfile.update({
        where: { id: student.id },
        data: { remainingMinutes: { increment: totalMinutes } },
      });

      const course = await tx.course.findUnique({ where: { id: courseId } });

      await tx.hourTransaction.create({
        data: {
          studentId: student.id,
          type: 'ADJUSTMENT',
          amountMinutes: totalMinutes,
          description: `Refund for deleted future classes in ${course?.name || 'course'} (${isTeacherEdit ? 'Teacher' : 'Admin'} edit)`,
        },
      });

      if (isTeacherEdit) {
        await tx.classRequest.create({
          data: {
            studentId: student.id,
            courseId: courseId,
            status: 'RESOLVED',
            notes: `[TEACHER_EDIT] Teacher ${teacher.user.firstName} ${teacher.user.lastName} deleted the schedule for ${course?.name || 'course'}.`,
            resolvedById: reqUser.id,
          },
        });
      }

      return { success: true, refundedMinutes: totalMinutes };
    });

    // Notify Student
    await this.notificationsService.create({
      userId: student.userId,
      type: 'SYSTEM',
      title: 'Schedule Deleted',
      message: `Your class schedule has been deleted by ${isTeacherEdit ? 'your teacher' : 'an administrator'}.`,
    });

    // Notify Teacher
    await this.notificationsService.create({
      userId: teacher.userId,
      type: 'SYSTEM',
      title: 'Schedule Deleted',
      message: `A class schedule has been deleted by ${isTeacherEdit ? 'you' : 'an administrator'}.`,
    });

    return result;
  }
}
