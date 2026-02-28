import { IsEnum, IsString, IsOptional } from 'class-validator';

export class SignAndDisburseContractDto {
  @IsString()
  signature: string;

  @IsEnum(['ESEWA', 'FONEPAY', 'KHALTI', 'WALLET', 'BANK_TRANSFER'])
  method: 'ESEWA' | 'FONEPAY' | 'KHALTI' | 'WALLET' | 'BANK_TRANSFER';

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  accountName?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;
}
