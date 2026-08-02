import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SchedulingService } from '../scheduling.service';
import { CreateAvailabilityDto } from '../dto/scheduling.dto';
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
    @Body() createAvailabilityDto: CreateAvailabilityDto,
  ): Promise<any> {
    return this.schedulingService.createAvailability(createAvailabilityDto);
  }

  @Get(':teacherId')
  async findOne(@Param('teacherId') teacherId: string): Promise<any> {
    return this.schedulingService.getAvailability(teacherId);
  }
}
