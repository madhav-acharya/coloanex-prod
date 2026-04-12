import { IsEnum, IsOptional, IsString } from 'class-validator';
import { KycStatus } from '../entities/kyc.entity';

export class VerifyKycDto {
  @IsEnum(KycStatus)
  status: KycStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  blockchainTxHash?: string;

  @IsOptional()
  blockchainData?: Record<string, unknown>;
}
