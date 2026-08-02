import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  threadId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;
}

export class CreateThreadDto {
  @IsString()
  @IsOptional()
  type?: string;

  @IsString({ each: true })
  @IsNotEmpty()
  participantUserIds: string[];
}
