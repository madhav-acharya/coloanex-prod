import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateWalletDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(['WEB', 'APP'])
  platform?: 'WEB' | 'APP';

  @IsOptional()
  @IsEnum(['PRIMARY', 'GAS', 'RECEIVE_ESEWA', 'RECEIVE_KHALTI', 'GENERAL'])
  purpose?: 'PRIMARY' | 'GAS' | 'RECEIVE_ESEWA' | 'RECEIVE_KHALTI' | 'GENERAL';
}
