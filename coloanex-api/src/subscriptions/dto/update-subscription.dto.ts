import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'EXPIRED', 'CANCELLED'])
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'CANCELLED';

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;
}
