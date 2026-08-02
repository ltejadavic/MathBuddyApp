import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProgramDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateProgramDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  programId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class EnrollStudentDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;
}

export class AssignTeacherDto {
  @IsString()
  @IsNotEmpty()
  teacherId: string;
}
