import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PresignUploadDto, CreateResourceDto } from './dto/storage.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Roles('ADMIN', 'TEACHER')
  @Post('presign-upload')
  async presignUpload(@Request() req: any, @Body() dto: PresignUploadDto) {
    return this.storageService.generatePresignedUploadUrl(req.user.id, dto);
  }

  @Roles('ADMIN', 'TEACHER')
  @Post('resources')
  async registerResource(@Request() req: any, @Body() dto: CreateResourceDto) {
    return this.storageService.registerResource(req.user.id, dto);
  }

  @Get('resources/course/:courseId')
  async getResourcesByCourse(@Param('courseId') courseId: string) {
    return this.storageService.getResourcesByCourse(courseId);
  }

  @Get('resources/my-files')
  async getMyResources(@Request() req: any) {
    return this.storageService.getMyResources(req.user.id);
  }

  @Get('resources/:id/download')
  async generateDownloadUrl(
    @Request() req: any,
    @Param('id') resourceId: string,
  ) {
    return this.storageService.generatePresignedDownloadUrl(
      req.user.id,
      resourceId,
    );
  }

  @Roles('ADMIN', 'TEACHER')
  @Delete('resources/:id')
  async deleteResource(@Request() req: any, @Param('id') resourceId: string) {
    return this.storageService.deleteResource(
      req.user.id,
      resourceId,
      req.user.role,
    );
  }
}
