import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  Max,
  Min,
} from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  courseId?: string;

  @IsString()
  @IsOptional()
  studentId?: string;
}

export class SubmitAssignmentDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;
}

export class GradeSubmissionDto {
  @IsNumber()
  @IsOptional()
  rawScore?: number;

  @IsNumber()
  @IsOptional()
  scaledScore?: number;

  @IsString()
  @IsOptional()
  publicFeedback?: string;

  @IsString()
  @IsOptional()
  privateNotes?: string;
}

export class CreateAssessmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  programId?: string;

  @IsString()
  @IsOptional()
  courseId?: string;

  @IsNumber()
  @IsOptional()
  totalRawScore?: number;
}

export class RecordAssessmentResultDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsDateString()
  @IsNotEmpty()
  dateTaken: string;

  @IsNumber()
  @IsNotEmpty()
  rawScore: number;

  @IsNumber()
  @IsOptional()
  scaledScore?: number;

  @IsString()
  @IsOptional()
  publicFeedback?: string;

  @IsString()
  @IsOptional()
  privateNotes?: string;
}

export class UpdateProgressDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsOptional()
  topicId?: string;

  @IsString()
  @IsOptional()
  skillId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  confidence?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateClassSummaryDto {
  @IsString()
  @IsNotEmpty()
  classSessionId: string;

  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsOptional()
  publicSummary?: string;

  @IsString()
  @IsOptional()
  privateNotes?: string;
}
