import {
  IsString,
  IsEnum,
  IsNumber,
  IsDate,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentFrequency } from '../entities/contract.entity';

export class CreateContractDto {
  @IsString()
  loanId: string;

  @IsString()
  ruleId: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsNumber()
  @Min(1)
  termMonths: number;

  @IsEnum(PaymentFrequency)
  paymentFrequency: PaymentFrequency;

  @IsString()
  termsAndConditions: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  loanAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  interestRate?: number;

  @IsOptional()
  @IsString()
  blockchainTxHash?: string;

  @IsOptional()
  blockchainData?: Record<string, unknown>;
}
