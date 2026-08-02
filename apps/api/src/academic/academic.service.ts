import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAssignmentDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
  CreateAssessmentDto,
  RecordAssessmentResultDto,
  UpdateProgressDto,
  CreateClassSummaryDto,
} from './dto/academic.dto';

@Injectable()
export class AcademicService {
  constructor(private prisma: PrismaService) {}

  // ================= ASSIGNMENTS =================

  async createAssignment(teacherUserId: string, data: CreateAssignmentDto) {
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw new ForbiddenException('User is not a teacher');

    return this.prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        teacherId: teacher.id,
        courseId: data.courseId,
        studentId: data.studentId,
      },
    });
  }

  async getAssignmentsForStudent(studentUserId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: studentUserId },
      include: { enrollments: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    const courseIds = student.enrollments.map((e) => e.courseId);

    return this.prisma.assignment.findMany({
      where: {
        OR: [{ studentId: student.id }, { courseId: { in: courseIds } }],
      },
      include: {
        submissions: {
          where: { studentId: student.id },
        },
      },
    });
  }

  async submitAssignment(
    studentUserId: string,
    assignmentId: string,
    data: SubmitAssignmentDto,
  ) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: studentUserId },
    });
    if (!student) throw new ForbiddenException('User is not a student');

    return this.prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: student.id,
        },
      },
      update: {
        content: data.content,
        attachmentUrl: data.attachmentUrl,
        submittedAt: new Date(),
        status: 'SUBMITTED',
      },
      create: {
        assignmentId,
        studentId: student.id,
        content: data.content,
        attachmentUrl: data.attachmentUrl,
        submittedAt: new Date(),
        status: 'SUBMITTED',
      },
    });
  }

  async gradeSubmission(
    teacherUserId: string,
    submissionId: string,
    data: GradeSubmissionDto,
  ) {
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw new ForbiddenException('User is not a teacher');

    return this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        rawScore: data.rawScore,
        scaledScore: data.scaledScore,
        publicFeedback: data.publicFeedback,
        privateNotes: data.privateNotes,
        status: 'GRADED',
        gradedById: teacher.id,
      },
    });
  }

  // ================= ASSESSMENTS =================

  async createAssessment(data: CreateAssessmentDto) {
    return this.prisma.assessment.create({
      data: {
        title: data.title,
        description: data.description,
        programId: data.programId,
        courseId: data.courseId,
        totalRawScore: data.totalRawScore,
      },
    });
  }

  async recordAssessmentResult(
    teacherUserId: string,
    assessmentId: string,
    data: RecordAssessmentResultDto,
  ) {
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw new ForbiddenException('User is not a teacher');

    return this.prisma.assessmentResult.create({
      data: {
        assessmentId,
        studentId: data.studentId,
        dateTaken: new Date(data.dateTaken),
        rawScore: data.rawScore,
        scaledScore: data.scaledScore,
        publicFeedback: data.publicFeedback,
        privateNotes: data.privateNotes,
        recordedById: teacher.id,
      },
    });
  }

  // ================= PROGRESS & SUMMARIES =================

  async updateProgress(teacherUserId: string, data: UpdateProgressDto) {
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw new ForbiddenException('User is not a teacher');

    const updateData: any = {
      status: data.status,
      confidence: data.confidence,
      notes: data.notes,
      updatedById: teacher.id,
    };

    if (data.topicId && data.skillId) {
      return this.prisma.progressRecord.upsert({
        where: {
          studentId_topicId_skillId: {
            studentId: data.studentId,
            topicId: data.topicId,
            skillId: data.skillId,
          },
        },
        update: updateData,
        create: {
          studentId: data.studentId,
          topicId: data.topicId,
          skillId: data.skillId,
          ...updateData,
        },
      });
    }

    // fallback create if not using unique compound (Prisma requires non-null for unique composite fields)
    return this.prisma.progressRecord.create({
      data: {
        studentId: data.studentId,
        topicId: data.topicId,
        skillId: data.skillId,
        status: data.status || 'NOT_STARTED',
        confidence: data.confidence,
        notes: data.notes,
        updatedById: teacher.id,
      },
    });
  }

  async createClassSummary(teacherUserId: string, data: CreateClassSummaryDto) {
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw new ForbiddenException('User is not a teacher');

    return this.prisma.classSummary.upsert({
      where: {
        classSessionId_studentId: {
          classSessionId: data.classSessionId,
          studentId: data.studentId,
        },
      },
      update: {
        publicSummary: data.publicSummary,
        privateNotes: data.privateNotes,
      },
      create: {
        classSessionId: data.classSessionId,
        studentId: data.studentId,
        teacherId: teacher.id,
        publicSummary: data.publicSummary,
        privateNotes: data.privateNotes,
      },
    });
  }

  async getStudentProgress(studentUserId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: studentUserId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const records = await this.prisma.progressRecord.findMany({
      where: { studentId: student.id },
      include: { topic: true, skill: true },
    });

    const assessmentResults = await this.prisma.assessmentResult.findMany({
      where: { studentId: student.id },
      include: { assessment: true },
    });

    const classSummaries = await this.prisma.classSummary.findMany({
      where: { studentId: student.id },
      select: {
        id: true,
        classSessionId: true,
        publicSummary: true,
        createdAt: true,
      },
    });

    return { records, assessmentResults, classSummaries };
  }
}
