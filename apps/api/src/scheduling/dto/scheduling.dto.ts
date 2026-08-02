import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateAvailabilityDto {
  @IsString()
  @IsNotEmpty()
  teacherId: string;

  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  @IsNotEmpty()
  startTime: string; // e.g. "09:00"

  @IsString()
  @IsNotEmpty()
  endTime: string; // e.g. "17:00"

  @IsString()
  @IsNotEmpty()
  timeZone: string;
}

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  teacherId: string;

  @IsDateString()
  scheduledStartTime: string;

  @IsDateString()
  scheduledEndTime: string;

  @IsString()
  @IsOptional()
  meetingLink?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateSessionDto {
  @IsDateString()
  @IsOptional()
  scheduledStartTime?: string;

  @IsDateString()
  @IsOptional()
  scheduledEndTime?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  meetingLink?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateAttendanceDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  status: string; // EXPECTED, PRESENT, ABSENT, EXCUSED
}
