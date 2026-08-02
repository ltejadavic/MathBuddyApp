import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
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
  async createThread(@Body() createThreadDto: CreateThreadDto) {
    return this.chatService.createThread(createThreadDto);
  }

  @Get('threads')
  async getThreads(@Request() req: any) {
    return this.chatService.getUserThreads(req.user.id);
  }

  @Get('threads/:id/messages')
  async getThreadMessages(@Param('id') threadId: string, @Request() req: any) {
    return this.chatService.getThreadMessages(threadId, req.user.id);
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
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    // Return a fake URL to simulate a real object storage URL
    return {
      attachmentUrl: `/uploads/${file.filename}`,
    };
  }
}
