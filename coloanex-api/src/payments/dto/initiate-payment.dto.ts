import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
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
  @IsString()
  walletId: string;

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

  @IsUrl({ require_tld: false })
  successUrl: string;

  @IsUrl({ require_tld: false })
  failureUrl: string;
}
