import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TransactionType,
  PaymentGateway,
} from '../entities/transaction.entity';

class PaymentDetailsDto {
  @IsEnum(PaymentGateway)
  gateway: PaymentGateway;

  @IsOptional()
  transactionId?: string;

  @IsOptional()
  accountNumber?: string;

  @IsOptional()
  accountName?: string;

  @IsOptional()
  remarks?: string;
}

export class CreateTransactionDto {
  @IsString()
  walletId: string;

  @IsOptional()
  @IsString()
  contractId?: string;

  @IsOptional()
  @IsString()
  paymentScheduleId?: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  paymentDetails?: PaymentDetailsDto;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  blockchain_tx_hash?: string;
}
