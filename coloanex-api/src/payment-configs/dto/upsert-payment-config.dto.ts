import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpsertPaymentConfigDto {
  @IsEnum(['USER', 'TENANT'])
  scope: 'USER' | 'TENANT';

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsEnum(['ESEWA', 'KHALTI'])
  gateway: 'ESEWA' | 'KHALTI';

  @IsEnum(['sandbox', 'production'])
  environment: 'sandbox' | 'production';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  publicKey?: string;

  @IsOptional()
  @IsString()
  secretKey?: string;

  @IsOptional()
  @IsString()
  merchantId?: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsObject()
  payoutConfig?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
