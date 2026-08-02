import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProgramDto,
  UpdateProgramDto,
  CreateCourseDto,
  EnrollStudentDto,
  AssignTeacherDto,
} from './dto/catalog.dto';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  // Programs
  async createProgram(data: CreateProgramDto): Promise<any> {
    return this.prisma.program.create({ data });
  }

  async getPrograms(): Promise<any> {
    return this.prisma.program.findMany({ include: { courses: true } });
  }

  async getProgram(id: string): Promise<any> {
    return this.prisma.program.findUnique({
      where: { id },
      include: { courses: true },
    });
  }

  async updateProgram(id: string, data: UpdateProgramDto): Promise<any> {
    return this.prisma.program.update({ where: { id }, data });
  }

  // Courses
  async createCourse(data: CreateCourseDto): Promise<any> {
    return this.prisma.course.create({ data });
  }

  async getCourses(): Promise<any> {
    return this.prisma.course.findMany({ include: { program: true } });
  }

  async getCourse(id: string): Promise<any> {
    return this.prisma.course.findUnique({
      where: { id },
      include: {
        subjects: true,
        teacherAssignments: {
          include: { teacher: { include: { user: true } } },
        },
        enrollments: { include: { student: { include: { user: true } } } },
      },
    });
  }

  async enrollStudent(courseId: string, data: EnrollStudentDto): Promise<any> {
    return this.prisma.enrollment.create({
      data: {
        courseId,
        studentId: data.studentId,
      },
    });
  }

  async assignTeacher(courseId: string, data: AssignTeacherDto): Promise<any> {
    return this.prisma.teacherCourse.create({
      data: {
        courseId,
        teacherId: data.teacherId,
      },
    });
  }
}
