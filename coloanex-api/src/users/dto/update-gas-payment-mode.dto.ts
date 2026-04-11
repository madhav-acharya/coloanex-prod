import { IsEnum } from 'class-validator';

export class UpdateGasPaymentModeDto {
  @IsEnum(['PLATFORM_WALLET', 'USER_WALLET'])
  gasPaymentMode: 'PLATFORM_WALLET' | 'USER_WALLET';
}
