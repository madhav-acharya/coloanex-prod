import { IsEnum, IsIn, IsOptional } from 'class-validator';

export class UpdateGasModeDto {
  @IsEnum(['USER_WALLET', 'PLATFORM_WALLET'])
  gasPaymentMode: 'USER_WALLET' | 'PLATFORM_WALLET';

  @IsOptional()
  @IsIn(['WEB', 'APP'])
  platform?: 'WEB' | 'APP';
}
