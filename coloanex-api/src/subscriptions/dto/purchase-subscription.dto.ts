import { IsEnum, IsOptional, IsString } from 'class-validator';

export class PurchaseSubscriptionDto {
  @IsString()
  planCode: string;

  @IsEnum(['USER', 'TENANT'])
  scope: 'USER' | 'TENANT';

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  paymentTransactionId?: string;
}
