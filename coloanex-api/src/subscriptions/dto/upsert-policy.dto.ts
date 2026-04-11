import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpsertSubscriptionPolicyDto {
  @IsEnum(['USER', 'TENANT'])
  scope: 'USER' | 'TENANT';

  @IsString()
  plan: string;

  @IsObject()
  rules: Record<string, unknown>;

  @IsObject()
  featureFlags: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
