import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CatalogService } from '../catalog.service';
import {
  CreateCourseDto,
  EnrollStudentDto,
  AssignTeacherDto,
} from '../dto/catalog.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@math-buddy/database';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly catalogService: CatalogService) {}

  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() createCourseDto: CreateCourseDto): Promise<any> {
    return this.catalogService.createCourse(createCourseDto);
  }

  @Get()
  async findAll(): Promise<any> {
    return this.catalogService.getCourses();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<any> {
    return this.catalogService.getCourse(id);
  }

  @Roles(Role.ADMIN)
  @Post(':id/enroll')
  async enrollStudent(
    @Param('id') id: string,
    @Body() enrollStudentDto: EnrollStudentDto,
  ): Promise<any> {
    return this.catalogService.enrollStudent(id, enrollStudentDto);
  }

  @Roles(Role.ADMIN)
  @Post(':id/assign-teacher')
  async assignTeacher(
    @Param('id') id: string,
    @Body() assignTeacherDto: AssignTeacherDto,
  ): Promise<any> {
    return this.catalogService.assignTeacher(id, assignTeacherDto);
  }
}
