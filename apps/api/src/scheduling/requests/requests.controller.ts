import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SchedulingService } from '../scheduling.service';
import {
  CreateClassRequestDto,
  ResolveClassRequestDto,
} from '../dto/scheduling.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@math-buddy/database';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Roles(Role.STUDENT)
  @Post()
  async create(@Body() createClassRequestDto: CreateClassRequestDto) {
    return this.schedulingService.createClassRequest(createClassRequestDto);
  }

  @Roles(Role.ADMIN)
  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.schedulingService.getClassRequests({ status, studentId });
  }

  @Roles(Role.ADMIN)
  @Patch(':id/resolve')
  async resolve(
    @Param('id') id: string,
    @Body() resolveDto: ResolveClassRequestDto,
    @Request() req: any,
  ) {
    resolveDto.resolvedById = req.user.id;
    return this.schedulingService.resolveClassRequest(id, resolveDto);
  }
}
