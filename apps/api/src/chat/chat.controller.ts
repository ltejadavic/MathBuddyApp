import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  InternalServerErrorException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateThreadDto } from './dto/chat.dto';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('threads')
  async createThread(
    @Req() req: any,
    @Body() createThreadDto: CreateThreadDto,
  ) {
    return this.chatService.createThread(req.user.sub, createThreadDto);
  }

  @Get('contacts')
  async getContacts(@Req() req: any) {
    try {
      return await this.chatService.getContactableUsers(req.user.sub);
    } catch (e: any) {
      console.error('Error in /chat/contacts:', e);
      throw new InternalServerErrorException(e.message || e.toString());
    }
  }

  @Get('directory/staff')
  async getStaffDirectory() {
    return this.chatService.getStaffDirectory();
  }

  @Get('directory/teachers')
  async getTeachersDirectory(@Req() req: any) {
    return this.chatService.getTeachersDirectory(req.user.sub, req.user.role);
  }

  @Get('directory/students')
  async getStudentsDirectory(@Req() req: any) {
    return this.chatService.getStudentsDirectory(req.user.sub, req.user.role);
  }

  @Get('threads')
  async getThreads(@Req() req: any) {
    return this.chatService.getUserThreads(req.user.sub);
  }

  @Get('threads/:id/messages')
  async getThreadMessages(@Param('id') threadId: string, @Req() req: any) {
    return this.chatService.getThreadMessages(threadId, req.user.sub);
  }

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
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  async uploadFile(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    // Register as a resource in the database so it appears in file management
    await this.chatService.registerFileAsResource(req.user.sub, file);

    // Return a fake URL to simulate a real object storage URL
    return {
      attachmentUrl: `/uploads/${file.filename}`,
    };
  }
}
