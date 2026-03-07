import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  DISBURSEMENT = 'DISBURSEMENT',
  INSTALLMENT_PAYMENT = 'INSTALLMENT_PAYMENT',
  PENALTY_PAYMENT = 'PENALTY_PAYMENT',
  FEE = 'FEE',
}

export class InitiatePaymentDto {
  @IsOptional()
  @IsString()
  walletId?: string;

  @IsOptional()
  @IsString()
  contractId?: string;

  @IsOptional()
  @IsString()
  paymentScheduleId?: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  gateway: string;

  @IsString()
  successUrl: string;

  @IsString()
  failureUrl: string;
}
