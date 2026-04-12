import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEmail,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { KycFileType } from '../entities/kyc.entity';

export class CreateKycFileDto {
  @IsEnum(KycFileType)
  fileType: KycFileType;

  @IsString()
  fileUrl: string;

  @IsOptional()
  documentMetadata?: Record<string, unknown>;
}

export class CreateKycDto {
  @IsOptional()
  @IsString()
  borrowerId?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  fullName: string;

  @IsDateString()
  dateOfBirth: string;

  @IsString()
  photoUrl: string;

  @IsNotEmpty()
  personalDetails: Record<string, unknown>;

  @IsNotEmpty()
  permanentAddress: Record<string, unknown>;

  @IsString()
  occupation: string;

  @IsNumber()
  monthlyIncome: number;

  @IsNotEmpty()
  bankDetails: Record<string, unknown>;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateKycFileDto)
  files?: CreateKycFileDto[];

  @IsOptional()
  @IsString()
  blockchainTxHash?: string;

  @IsOptional()
  blockchainData?: Record<string, unknown>;
}
