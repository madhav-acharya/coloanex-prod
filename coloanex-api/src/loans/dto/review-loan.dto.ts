import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LoanStatus } from '../entities/loan.entity';

export class ReviewLoanDto {
  @IsEnum(LoanStatus)
  status: LoanStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
