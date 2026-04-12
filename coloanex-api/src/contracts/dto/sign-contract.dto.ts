import { IsString, IsOptional } from 'class-validator';

export class SignContractDto {
  @IsString()
  signature: string; // base64 encoded signature

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  blockchainTxHash?: string;

  @IsOptional()
  blockchainData?: Record<string, unknown>;
}
