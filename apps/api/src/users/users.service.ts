import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Role } from '@math-buddy/database';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const {
      email,
      password,
      role,
      firstName,
      lastName,
      timezone,
      country,
      studentIdToLink,
    } = createUserDto;

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role,
          firstName,
          lastName,
          timezone,
          country,
        },
      });

      // Create role specific profile
      if (role === Role.STUDENT) {
        await tx.studentProfile.create({
          data: { userId: user.id },
        });
      } else if (role === Role.TEACHER) {
        await tx.teacherProfile.create({
          data: { userId: user.id },
        });
      } else if (role === Role.GUARDIAN) {
        const guardian = await tx.guardianProfile.create({
          data: { userId: user.id },
        });

        if (studentIdToLink) {
          const studentProfile = await tx.studentProfile.findUnique({
            where: { userId: studentIdToLink },
          });
          if (studentProfile) {
            await tx.studentGuardian.create({
              data: {
                studentId: studentProfile.id,
                guardianId: guardian.id,
                relationshipType: 'UNKNOWN',
                isPrimaryBilling: true,
              },
            });
          }
        }
      }

      return this.findOne(user.id);
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        teacherProfile: {
          include: { courses: { include: { course: true } } },
        },
        studentProfile: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: {
          include: {
            guardians: { include: { guardian: { include: { user: true } } } },
          },
        },
        teacherProfile: {
          include: { courses: { include: { course: true } } },
        },
        guardianProfile: {
          include: {
            students: { include: { student: { include: { user: true } } } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, refreshTokenHash, ...result } = user;
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { password, ...rest } = updateUserDto;
    const data: any = { ...rest };

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, refreshTokenHash, ...result } = user;
    return result;
  }

  async remove(id: string) {
    // Soft delete
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getPublicProfile(targetId: string, requesterId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetId },
      include: {
        studentProfile: true,
        teacherProfile: {
          include: { courses: { include: { course: true } } }
        },
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, refreshTokenHash, email, ...publicData } = targetUser;
    
    let returnedEmail = email;

    // Role-specific data exposure
    if (requester?.role !== Role.ADMIN) {
      // Non-admins shouldn't see student emails for privacy
      if (targetUser.role === Role.STUDENT) {
        returnedEmail = 'Hidden for privacy';
      }
    }

    return { ...publicData, email: returnedEmail };
  }
}
