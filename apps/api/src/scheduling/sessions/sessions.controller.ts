import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SchedulingService } from '../scheduling.service';
import {
  CreateSessionDto,
  UpdateSessionDto,
  UpdateAttendanceDto,
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

  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() createSessionDto: CreateSessionDto): Promise<any> {
    return this.schedulingService.createSession(createSessionDto);
  }

  @Get()
  async findAll(): Promise<any> {
    return this.schedulingService.getSessions();
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
}
