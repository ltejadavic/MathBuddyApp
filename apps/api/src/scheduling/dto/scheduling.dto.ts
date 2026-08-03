import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
  IsArray
} from 'class-validator';
import { Type } from 'class-transformer';

export class AvailabilitySlotDto {
  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsString()
  @IsNotEmpty()
  timeZone: string;
}


export class CreateAvailabilityDto extends AvailabilitySlotDto {
  @IsString()
  @IsNotEmpty()
  teacherId: string;
}

export class UpdateBulkAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots: AvailabilitySlotDto[];
}

export class CreateStudentAvailabilityDto extends AvailabilitySlotDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;
}

export class UpdateBulkStudentAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots: AvailabilitySlotDto[];
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

export class CreateClassRequestDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ResolveClassRequestDto {
  @IsString()
  @IsNotEmpty()
  status: string; // RESOLVED, CANCELLED

  @IsString()
  @IsOptional()
  resolvedById?: string;
}

export class ScheduleMatchedClassesDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  teacherId: string;

  @IsString()
  @IsOptional()
  classRequestId?: string;

  @IsInt()
  @Min(1)
  totalMinutesToConsume: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots: AvailabilitySlotDto[];

  @IsDateString()
  @IsNotEmpty()
  startDate: string;
}

export class ReplicateAvailabilityDto {
  @IsString()
  @IsNotEmpty()
  userId: string; // can be studentId or teacherId

  @IsString()
  @IsNotEmpty()
  role: string; // 'TEACHER' or 'STUDENT'

  @IsDateString()
  @IsNotEmpty()
  sourceStartDate: string;

  @IsDateString()
  @IsNotEmpty()
  sourceEndDate: string;

  @IsDateString()
  @IsNotEmpty()
  targetStartDate: string;

  @IsDateString()
  @IsNotEmpty()
  targetEndDate: string;
}

export class EditScheduleDto {
  studentId: string;
  teacherId: string;
  slots: { date: string; startTime: string; endTime: string }[];
}
