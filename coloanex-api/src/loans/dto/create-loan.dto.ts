import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  Max,
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
  providedLoanAmount: number;

  @IsNumber()
  @IsPositive()
  expectedLoanAmount: number;

  @IsString()
  loanPurpose: string;

  @IsString()
  collateralType: string;

  @IsString()
  collateralDescription: string;

  @IsNumber()
  @IsPositive()
  collateralValue: number;

  @IsString()
  collateralImageUrl: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsNumber()
  @IsPositive()
  @Min(0)
  @Max(100)
  interestRate: number;

  @IsInt()
  @IsPositive()
  @Min(1)
  termMonths: number;
}
