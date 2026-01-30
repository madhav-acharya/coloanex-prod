import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';

export class CreateLoanDto {
  @IsOptional()
  @IsString()
  borrowerId?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsNumber()
  @IsPositive()
  requestedAmount: number;

  @IsString()
  purpose: string;

  @IsNotEmpty()
  collateralDetails: Record<string, unknown>;

  @IsInt()
  @IsPositive()
  @Min(1)
  requestedTermMonths: number;
}
