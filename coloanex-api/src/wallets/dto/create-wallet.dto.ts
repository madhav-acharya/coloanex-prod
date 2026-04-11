import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateWalletDto {
  @IsEnum(['METAMASK', 'EXPO_SECURE', 'ESEWA', 'KHALTI'])
  provider: 'METAMASK' | 'EXPO_SECURE' | 'ESEWA' | 'KHALTI';

  @IsOptional()
  @IsEnum(['PRIMARY', 'GAS', 'RECEIVE_ESEWA', 'RECEIVE_KHALTI', 'GENERAL'])
  purpose?: 'PRIMARY' | 'GAS' | 'RECEIVE_ESEWA' | 'RECEIVE_KHALTI' | 'GENERAL';

  @IsEnum(['WEB', 'APP'])
  platform: 'WEB' | 'APP';

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  label?: string;
}
