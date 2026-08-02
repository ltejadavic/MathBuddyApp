import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateThreadDto, SendMessageDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createThread(data: CreateThreadDto) {
    return this.prisma.chatThread.create({
      data: {
        type: data.type || 'DIRECT',
        participants: {
          create: data.participantUserIds.map((userId) => ({ userId })),
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
          include: { user: { select: { id: true, email: true, role: true } } },
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

    return this.prisma.chatMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, email: true, role: true } },
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
        sender: { select: { id: true, email: true, role: true } },
      },
    });

    // Update the thread's updatedAt timestamp
    await this.prisma.chatThread.update({
      where: { id: data.threadId },
      data: { updatedAt: new Date() },
    });

    return message;
  }
}
