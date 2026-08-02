import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateThreadDto, SendMessageDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getContactableUsers(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      return this.prisma.user.findMany({
        where: { id: { not: userId } },
        select: { id: true, email: true, role: true, firstName: true, lastName: true },
      });
    }

    if (user.role === 'STUDENT') {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { student: { userId: userId }, status: 'ACTIVE' },
        include: { course: { include: { teacherAssignments: { include: { teacher: true } } } } },
      });

      const teacherIds = new Set<string>();
      enrollments.forEach(e => {
        e.course.teacherAssignments.forEach(ta => {
          teacherIds.add(ta.teacher.userId);
        });
      });

      return this.prisma.user.findMany({
        where: {
          OR: [
            { role: 'ADMIN' },
            { id: { in: Array.from(teacherIds) } },
          ],
          id: { not: userId },
        },
        select: { id: true, email: true, role: true, firstName: true, lastName: true },
      });
    }

    if (user.role === 'TEACHER') {
      const teacherCourses = await this.prisma.teacherCourse.findMany({
        where: { teacher: { userId: userId } },
        include: { course: { include: { enrollments: { where: { status: 'ACTIVE' }, include: { student: true } } } } },
      });

      const studentIds = new Set<string>();
      teacherCourses.forEach(tc => {
        tc.course.enrollments.forEach(e => {
          studentIds.add(e.student.userId);
        });
      });

      return this.prisma.user.findMany({
        where: {
          OR: [
            { role: 'ADMIN' },
            { role: 'TEACHER' },
            { id: { in: Array.from(studentIds) } },
          ],
          id: { not: userId },
        },
        select: { id: true, email: true, role: true, firstName: true, lastName: true },
      });
    }

    return [];
  }

  async createThread(userId: string, data: CreateThreadDto) {
    // Check if the user is authorized to chat with all participants
    const contactableUsers = await this.getContactableUsers(userId);
    const contactableIds = new Set(contactableUsers.map(u => u.id));

    // Exclude the user themselves from the check, just in case they added themselves
    const otherParticipants = data.participantUserIds.filter(id => id !== userId);

    for (const participantId of otherParticipants) {
      if (!contactableIds.has(participantId)) {
        throw new ForbiddenException(`You are not authorized to chat with user ${participantId}`);
      }
    }

    // Ensure the creator is included
    const allParticipantIds = Array.from(new Set([...data.participantUserIds, userId]));

    // Check if a direct thread already exists between these EXACT participants
    if (data.type === 'DIRECT' && allParticipantIds.length === 2) {
      const existingThread = await this.prisma.chatThread.findFirst({
        where: {
          type: 'DIRECT',
          AND: [
            { participants: { some: { userId: allParticipantIds[0] } } },
            { participants: { some: { userId: allParticipantIds[1] } } },
          ],
        },
        include: {
          participants: { include: { user: true } },
        },
      });

      if (existingThread) {
        return existingThread;
      }
    }

    return this.prisma.chatThread.create({
      data: {
        type: data.type || 'DIRECT',
        participants: {
          create: allParticipantIds.map((id) => ({ userId: id })),
        },
      },
      include: {
        participants: { include: { user: true } },
      },
    });
  }

  async getUserThreads(userId: string) {
    const participants = await this.prisma.chatParticipant.findMany({
      where: { userId },
      select: { threadId: true },
    });

    const threadIds = participants.map((p) => p.threadId);

    return this.prisma.chatThread.findMany({
      where: { id: { in: threadIds } },
      include: {
        participants: {
          include: { user: { select: { id: true, email: true, role: true, firstName: true, lastName: true } } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get the latest message for preview
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getThreadMessages(threadId: string, userId: string) {
    // Ensure the user is a participant
    const participant = await this.prisma.chatParticipant.findUnique({
      where: {
        threadId_userId: { threadId, userId },
      },
    });

    if (!participant) {
      throw new NotFoundException('Thread not found or access denied');
    }

    await this.markThreadAsRead(threadId, userId);

    return this.prisma.chatMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, email: true, role: true, firstName: true, lastName: true } },
      },
    });
  }

  async saveMessage(senderId: string, data: SendMessageDto) {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: {
        threadId_userId: { threadId: data.threadId, userId: senderId },
      },
    });

    if (!participant) {
      throw new NotFoundException('Thread not found or access denied');
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        threadId: data.threadId,
        senderId,
        content: data.content,
        attachmentUrl: data.attachmentUrl,
      },
      include: {
        sender: { select: { id: true, email: true, role: true, firstName: true, lastName: true } },
      },
    });

    // Update the thread's updatedAt timestamp
    await this.prisma.chatThread.update({
      where: { id: data.threadId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async markThreadAsRead(threadId: string, userId: string) {
    try {
      await this.prisma.chatParticipant.update({
        where: { threadId_userId: { threadId, userId } },
        data: { lastReadAt: new Date() },
      });
    } catch (e) {
      // Participant might not exist if data is inconsistent, but we ignore to not crash
      console.error('Failed to mark thread as read', e);
    }
  }

  async getThreadParticipants(threadId: string) {
    return this.prisma.chatParticipant.findMany({
      where: { threadId },
      select: { userId: true },
    });
  }

  async registerFileAsResource(userId: string, file: Express.Multer.File) {
    return this.prisma.resource.create({
      data: {
        title: file.originalname,
        description: 'Uploaded via chat',
        fileKey: `/uploads/${file.filename}`,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploaderId: userId,
      }
    });
  }

  async getStaffDirectory() {
    const staff = await this.prisma.user.findMany({
      where: { role: 'ADMIN', deletedAt: null },
      select: { id: true, email: true, role: true, firstName: true, lastName: true },
    });
    return staff.map(s => ({ ...s, isActive: true }));
  }

  async getTeachersDirectory(userId: string, userRole: string) {
    if (userRole === 'ADMIN' || userRole === 'TEACHER') {
      const teachers = await this.prisma.user.findMany({
        where: { role: 'TEACHER', deletedAt: null },
        select: { id: true, email: true, role: true, firstName: true, lastName: true },
      });
      return teachers.map(t => ({ ...t, isActive: true }));
    }

    if (userRole === 'STUDENT') {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { student: { userId: userId }, status: 'ACTIVE' },
        include: { course: { include: { teacherAssignments: { include: { teacher: { include: { user: true } } } } } } },
      });

      const teacherMap = new Map<string, any>();
      enrollments.forEach(e => {
        e.course.teacherAssignments.forEach(ta => {
          const t = ta.teacher.user;
          if (t && !t.deletedAt && !teacherMap.has(t.id)) {
            teacherMap.set(t.id, {
              id: t.id, email: t.email, role: t.role, firstName: t.firstName, lastName: t.lastName,
              isActive: true
            });
          }
        });
      });

      return Array.from(teacherMap.values());
    }

    return [];
  }

  async getStudentsDirectory(userId: string, userRole: string) {
    if (userRole === 'ADMIN') {
      const students = await this.prisma.user.findMany({
        where: { role: 'STUDENT', deletedAt: null },
        select: { 
          id: true, email: true, role: true, firstName: true, lastName: true,
          studentProfile: { include: { enrollments: true } }
        },
      });
      return students.map(s => {
        const { studentProfile, ...rest } = s;
        const isActive = studentProfile?.enrollments.some(e => e.status === 'ACTIVE') || false;
        return { ...rest, isActive };
      });
    }

    if (userRole === 'TEACHER') {
      const teacherCourses = await this.prisma.teacherCourse.findMany({
        where: { teacher: { userId: userId } },
        include: { course: { include: { enrollments: { include: { student: { include: { user: true } } } } } } },
      });

      const studentMap = new Map<string, any>();
      teacherCourses.forEach(tc => {
        tc.course.enrollments.forEach(e => {
          const s = e.student.user;
          if (!s || s.deletedAt) return;
          
          const existing = studentMap.get(s.id);
          const isActive = e.status === 'ACTIVE';
          if (!existing) {
            studentMap.set(s.id, {
              id: s.id, email: s.email, role: s.role, firstName: s.firstName, lastName: s.lastName,
              isActive: isActive
            });
          } else {
            existing.isActive = existing.isActive || isActive;
          }
        });
      });

      return Array.from(studentMap.values());
    }

    return [];
  }
}
