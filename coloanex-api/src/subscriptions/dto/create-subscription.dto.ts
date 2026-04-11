import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsEnum(['USER', 'TENANT'])
  scope: 'USER' | 'TENANT';

  @IsString()
  plan: string;

  @IsEnum(['ACTIVE', 'INACTIVE', 'EXPIRED', 'CANCELLED'])
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'CANCELLED';

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsDateString()
  startsAt: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;
}
