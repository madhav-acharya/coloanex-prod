import { IsEnum } from 'class-validator';

export class UpdateGasModeDto {
  @IsEnum(['USER_WALLET', 'PLATFORM_WALLET'])
  gasPaymentMode: 'USER_WALLET' | 'PLATFORM_WALLET';
}
