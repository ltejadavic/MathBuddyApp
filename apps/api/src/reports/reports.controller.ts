import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@math-buddy/database';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('admin')
  @Roles(Role.ADMIN)
  async getAdminDashboard() {
    return this.reportsService.getAdminDashboardMetrics();
  }

  @Get('teacher')
  @Roles(Role.TEACHER)
  async getTeacherDashboard(@Request() req: any) {
    return this.reportsService.getTeacherDashboardMetrics(req.user.sub);
  }

  @Get('student')
  @Roles(Role.STUDENT, Role.GUARDIAN)
  async getStudentDashboard(@Request() req: any) {
    // If it's a guardian, we might need a different method or to get the linked student's metrics.
    // For MVP, if it's student, we pass their userId.
    return this.reportsService.getStudentDashboardMetrics(req.user.sub);
  }
}
