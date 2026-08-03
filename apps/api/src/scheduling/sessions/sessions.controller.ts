import {
  Controller,
  Get, Put, Delete,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SchedulingService } from '../scheduling.service';
import {
  CreateSessionDto,
  UpdateSessionDto,
  UpdateAttendanceDto, EditScheduleDto,
  ScheduleMatchedClassesDto,
} from '../dto/scheduling.dto';
import { CompleteSessionDto } from '../dto/complete-session.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@math-buddy/database';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Roles(Role.ADMIN, Role.STUDENT)
  @Post()
  async create(@Body() createSessionDto: CreateSessionDto): Promise<any> {
    return this.schedulingService.createSession(createSessionDto);
  }

  @Roles(Role.ADMIN)
  @Post('matchmaking/schedule')
  async scheduleMatched(@Body() dto: ScheduleMatchedClassesDto): Promise<any> {
    return this.schedulingService.scheduleMatchedClasses(dto);
  }

  @Get()
  async findAll(@Query('studentId') studentId?: string, @Query('teacherId') teacherId?: string): Promise<any> {
    return this.schedulingService.getSessions({ studentId, teacherId });
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<any> {
    return this.schedulingService.getSession(id);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSessionDto: UpdateSessionDto,
  ): Promise<any> {
    return this.schedulingService.updateSession(id, updateSessionDto);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Patch(':id/attendance')
  async updateAttendance(
    @Param('id') id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ): Promise<any> {
    return this.schedulingService.updateAttendance(id, updateAttendanceDto);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Post(':id/complete')
  async complete(
    @Param('id') id: string,
    @Body() completeSessionDto: CompleteSessionDto,
  ): Promise<any> {
    return this.schedulingService.completeSession(id, completeSessionDto);
  }

  @Roles(Role.ADMIN)
  @Get('schedules/list')
  getSchedules(@Query('studentId') studentId: string, @Query('teacherId') teacherId: string) {
    return this.schedulingService.getSchedules(studentId, teacherId);
  }

  @Roles(Role.ADMIN)
  @Put('schedules/:courseId')
  updateSchedule(@Param('courseId') courseId: string, @Body() data: EditScheduleDto) {
    return this.schedulingService.updateSchedule(courseId, data);
  }

  @Roles(Role.ADMIN)
  @Delete('schedules/:courseId')
  deleteSchedule(@Param('courseId') courseId: string, @Query('studentId') studentId: string, @Query('teacherId') teacherId: string) {
    return this.schedulingService.deleteSchedule(courseId, studentId, teacherId);
  }
}
