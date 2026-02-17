import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  ValidateIf,
} from 'class-validator';
import { LoanStatus } from '../entities/loan.entity';

export class ReviewLoanDto {
  @IsEnum(LoanStatus)
  status: LoanStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ValidateIf((o) => o.status === LoanStatus.APPROVED)
  @IsUUID()
  ruleId?: string;

  @ValidateIf((o) => o.status === LoanStatus.APPROVED)
  @IsNumber()
  approvedAmount?: number;

  @ValidateIf((o) => o.status === LoanStatus.APPROVED)
  @IsNumber()
  approvedTermMonths?: number;
}
