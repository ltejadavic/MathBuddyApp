import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsOptional()
  guardianId?: string;

  @IsInt()
  @Min(1)
  amountCents: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @IsInt()
  @Min(1)
  packageMinutes: number;
}
