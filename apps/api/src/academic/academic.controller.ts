import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AcademicService } from './academic.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  CreateAssignmentDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
  CreateAssessmentDto,
  RecordAssessmentResultDto,
  UpdateProgressDto,
  CreateClassSummaryDto,
  CreateProgramDto,
  UpdateProgramDto,
  CreateCourseDto,
  UpdateCourseDto,
  AssignTeacherDto,
} from './dto/academic.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  // --- Assignments ---

  @Roles('TEACHER', 'ADMIN')
  @Post('assignments')
  async createAssignment(
    @Request() req: any,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.academicService.createAssignment(req.user.id, dto);
  }

  @Get('assignments')
  async getMyAssignments(@Request() req: any) {
    return this.academicService.getAssignmentsForStudent(req.user.id);
  }

  @Roles('STUDENT')
  @Post('assignments/:id/submissions')
  async submitAssignment(
    @Request() req: any,
    @Param('id') assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.academicService.submitAssignment(
      req.user.id,
      assignmentId,
      dto,
    );
  }

  @Roles('STUDENT')
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit for assignments
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    return { attachmentUrl: `/uploads/${file.filename}` };
  }

  @Roles('TEACHER', 'ADMIN')
  @Patch('submissions/:id/grade')
  async gradeSubmission(
    @Request() req: any,
    @Param('id') submissionId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.academicService.gradeSubmission(req.user.id, submissionId, dto);
  }

  // --- Assessments ---

  @Roles('ADMIN')
  @Post('assessments')
  async createAssessment(@Body() dto: CreateAssessmentDto) {
    return this.academicService.createAssessment(dto);
  }

  @Roles('TEACHER', 'ADMIN')
  @Post('assessments/:id/results')
  async recordAssessmentResult(
    @Request() req: any,
    @Param('id') assessmentId: string,
    @Body() dto: RecordAssessmentResultDto,
  ) {
    return this.academicService.recordAssessmentResult(
      req.user.id,
      assessmentId,
      dto,
    );
  }

  // --- Progress & Summaries ---

  @Roles('TEACHER', 'ADMIN')
  @Post('progress')
  async updateProgress(@Request() req: any, @Body() dto: UpdateProgressDto) {
    return this.academicService.updateProgress(req.user.id, dto);
  }

  @Roles('TEACHER', 'ADMIN')
  @Post('class-summaries')
  async createClassSummary(
    @Request() req: any,
    @Body() dto: CreateClassSummaryDto,
  ) {
    return this.academicService.createClassSummary(req.user.id, dto);
  }

  @Get('student/progress')
  async getMyProgress(@Request() req: any) {
    // A student fetches their own progress
    return this.academicService.getStudentProgress(req.user.id);
  }

  // --- Programs & Courses (Admin) ---

  @Roles('ADMIN')
  @Post('programs')
  async createProgram(@Body() dto: CreateProgramDto) {
    return this.academicService.createProgram(dto);
  }

  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN')
  @Get('programs')
  async findAllPrograms() {
    return this.academicService.findAllPrograms();
  }

  @Roles('ADMIN')
  @Patch('programs/:id')
  async updateProgram(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    return this.academicService.updateProgram(id, dto);
  }

  @Roles('ADMIN')
  @Delete('programs/:id')
  async deleteProgram(@Param('id') id: string) {
    return this.academicService.deleteProgram(id);
  }

  @Roles('ADMIN')
  @Post('courses')
  async createCourse(@Body() dto: CreateCourseDto & { programId: string }) {
    return this.academicService.createCourse(dto);
  }

  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN')
  @Get('courses')
  async findAllCourses() {
    return this.academicService.findAllCourses();
  }

  @Roles('ADMIN')
  @Patch('courses/:id')
  async updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.academicService.updateCourse(id, dto);
  }

  @Roles('ADMIN')
  @Delete('courses/:id')
  async deleteCourse(@Param('id') id: string) {
    return this.academicService.deleteCourse(id);
  }

  // --- Teacher Assignments (Admin) ---

  @Roles('ADMIN')
  @Post('courses/:courseId/teachers')
  async assignTeacher(
    @Param('courseId') courseId: string,
    @Body() dto: AssignTeacherDto,
  ) {
    return this.academicService.assignTeacher(courseId, dto);
  }

  @Roles('ADMIN')
  @Delete('courses/:courseId/teachers/:teacherId')
  async removeTeacherAssignment(
    @Param('courseId') courseId: string,
    @Param('teacherId') teacherId: string,
  ) {
    return this.academicService.removeTeacherAssignment(courseId, teacherId);
  }
}
