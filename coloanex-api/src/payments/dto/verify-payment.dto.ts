import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @IsString()
  transactionId: string;

  @IsString()
  transactionUuid: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  totalAmount?: number;
}
