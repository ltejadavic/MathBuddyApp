import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SchedulingService } from '../scheduling.service';
import {
  UpdateBulkAvailabilityDto,
  UpdateBulkStudentAvailabilityDto,
} from '../dto/scheduling.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@math-buddy/database';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Roles(Role.ADMIN, Role.TEACHER)
  @Post()
  async create(
    @Request() req: any,
    @Body() dto: UpdateBulkAvailabilityDto,
  ): Promise<any> {
    return this.schedulingService.updateAvailability(
      req.user.sub || req.user.id,
      dto,
    );
  }

  @Get('teacher/:teacherId')
  async findOne(@Param('teacherId') teacherId: string): Promise<any> {
    return this.schedulingService.getAvailability(teacherId);
  }

  @Roles(Role.ADMIN, Role.STUDENT)
  @Post('student')
  async createStudent(
    @Request() req: any,
    @Body() dto: UpdateBulkStudentAvailabilityDto,
  ): Promise<any> {
    return this.schedulingService.updateStudentAvailability(
      req.user.sub || req.user.id,
      dto,
    );
  }

  @Get('student/:studentId')
  async findStudent(@Param('studentId') studentId: string): Promise<any> {
    return this.schedulingService.getStudentAvailability(studentId);
  }

  @Roles(Role.ADMIN)
  @Get('match/:studentId/:teacherId')
  async match(
    @Param('studentId') studentId: string,
    @Param('teacherId') teacherId: string,
  ): Promise<any> {
    return this.schedulingService.getMatchmakingAvailability(
      studentId,
      teacherId,
    );
  }
}
