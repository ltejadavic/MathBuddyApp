import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StudentAttendanceDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  status: string; // e.g., 'PRESENT', 'ABSENT_EXCUSED', 'ABSENT_NO_SHOW'
}

export class CompleteSessionDto {
  @IsDateString()
  actualStartTime: string;

  @IsDateString()
  actualEndTime: string;

  @IsInt()
  @Min(1)
  actualDurationMinutes: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceDto)
  attendances: StudentAttendanceDto[];
}
