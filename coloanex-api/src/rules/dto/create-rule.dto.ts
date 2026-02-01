import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RuleType } from '../entities/rule.entity';

class LoanLimitsDto {
  @IsNumber()
  @Min(0)
  minAmount: number;

  @IsNumber()
  @Min(0)
  maxAmount: number;

  @IsNumber()
  @Min(1)
  minTermMonths: number;

  @IsNumber()
  @Min(1)
  maxTermMonths: number;
}

class PenaltyConfigDto {
  @IsEnum(['PERCENTAGE', 'FIXED_AMOUNT'])
  penaltyType: 'PERCENTAGE' | 'FIXED_AMOUNT';

  @IsNumber()
  @Min(0)
  penaltyAmount: number;

  @IsNumber()
  @Min(0)
  gracePeriodDays: number;
}

class PaymentConfigDto {
  @IsEnum(['WEEKLY', 'MONTHLY', 'QUARTERLY'], { each: true })
  allowedFrequencies: ('WEEKLY' | 'MONTHLY' | 'QUARTERLY')[];

  @IsBoolean()
  allowEarlyPayment: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  earlyPaymentPenalty?: number;
}

export class CreateRuleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(RuleType)
  ruleType: RuleType;

  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate: number;

  @ValidateNested()
  @Type(() => LoanLimitsDto)
  loanLimits: LoanLimitsDto;

  @ValidateNested()
  @Type(() => PenaltyConfigDto)
  penaltyConfig: PenaltyConfigDto;

  @ValidateNested()
  @Type(() => PaymentConfigDto)
  paymentConfig: PaymentConfigDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPubliclyVisible?: boolean;
}
