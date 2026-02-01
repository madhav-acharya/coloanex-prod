import { IsOptional, IsString } from 'class-validator';

export class CreateWalletDto {
  @IsOptional()
  @IsString()
  esewa?: string;

  @IsOptional()
  @IsString()
  fonepay?: string;

  @IsOptional()
  @IsString()
  khalti?: string;
}
