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

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  issueDistrict?: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsString()
  fileUrl: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsNumber()
  sizeInBytes?: number;
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

  @IsArray()
  @IsString({ each: true })
  documentTypes: string[];

  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsString()
  lastName: string;

  @IsString()
  passportSizePhotoUrl: string;

  @IsDateString()
  dateOfBirth: string;

  @IsString()
  gender: string;

  @IsString()
  maritalStatus: string;

  @IsString()
  fatherName: string;

  @IsString()
  motherName: string;

  @IsString()
  grandfatherName: string;

  @IsString()
  permanentProvince: string;

  @IsString()
  permanentDistrict: string;

  @IsString()
  permanentMunicipality: string;

  @IsString()
  permanentWard: string;

  @IsString()
  permanentTole: string;

  @IsString()
  occupation: string;

  @IsNumber()
  monthlyIncome: number;

  @IsString()
  bankName: string;

  @IsString()
  bankAccountNumber: string;

  @IsString()
  bankBranch: string;

  @IsNumber()
  loanAmount: number;

  @IsString()
  loanPurpose: string;

  @IsNumber()
  loanDuration: number;

  @IsString()
  collateralType: string;

  @IsString()
  collateralDescription: string;

  @IsNumber()
  collateralValue: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateKycFileDto)
  files?: CreateKycFileDto[];
}
