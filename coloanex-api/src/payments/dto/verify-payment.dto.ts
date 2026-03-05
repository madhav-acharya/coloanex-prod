import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export enum VerifyTransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  DISBURSEMENT = 'DISBURSEMENT',
  INSTALLMENT_PAYMENT = 'INSTALLMENT_PAYMENT',
  PENALTY_PAYMENT = 'PENALTY_PAYMENT',
  FEE = 'FEE',
}

export class VerifyPaymentDto {
  @IsString()
  transactionUuid: string;

  @IsNumber()
  @IsPositive()
  totalAmount: number;

  @IsString()
  gateway: string;

  @IsString()
  walletId: string;

  @IsEnum(VerifyTransactionType)
  type: VerifyTransactionType;

  @IsOptional()
  @IsString()
  contractId?: string;

  @IsOptional()
  @IsString()
  paymentScheduleId?: string;
}
