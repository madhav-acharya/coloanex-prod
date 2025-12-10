import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { KycFileType } from '../entities/kyc.entity';

export class CreateKycFileDto {
  @IsEnum(KycFileType)
  fileType: KycFileType;

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

  @IsDateString()
  dateOfBirth: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  spouseName?: string;

  @IsOptional()
  @IsString()
  fatherName?: string;

  @IsOptional()
  @IsString()
  motherName?: string;

  @IsOptional()
  @IsString()
  grandfatherName?: string;

  @IsOptional()
  @IsString()
  citizenshipNumber?: string;

  @IsOptional()
  @IsDateString()
  citizenshipIssueDate?: string;

  @IsOptional()
  @IsString()
  citizenshipDistrict?: string;

  @IsOptional()
  @IsString()
  passportNumber?: string;

  @IsOptional()
  @IsDateString()
  passportIssueDate?: string;

  @IsOptional()
  @IsDateString()
  passportExpiryDate?: string;

  @IsOptional()
  @IsString()
  panNumber?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsDateString()
  licenseIssueDate?: string;

  @IsOptional()
  @IsDateString()
  licenseExpiryDate?: string;

  @IsOptional()
  @IsString()
  permanentProvince?: string;

  @IsOptional()
  @IsString()
  permanentDistrict?: string;

  @IsOptional()
  @IsString()
  permanentMunicipality?: string;

  @IsOptional()
  @IsString()
  permanentWard?: string;

  @IsOptional()
  @IsString()
  permanentTole?: string;

  @IsOptional()
  @IsString()
  temporaryProvince?: string;

  @IsOptional()
  @IsString()
  temporaryDistrict?: string;

  @IsOptional()
  @IsString()
  temporaryMunicipality?: string;

  @IsOptional()
  @IsString()
  temporaryWard?: string;

  @IsOptional()
  @IsString()
  temporaryTole?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  alternatePhone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  employerName?: string;

  @IsOptional()
  @IsNumber()
  monthlyIncome?: number;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @IsOptional()
  @IsString()
  bankBranch?: string;

  @IsOptional()
  @IsNumber()
  loanAmount?: number;

  @IsOptional()
  @IsString()
  loanPurpose?: string;

  @IsOptional()
  @IsNumber()
  loanDuration?: number;

  @IsOptional()
  @IsString()
  collateralType?: string;

  @IsOptional()
  @IsString()
  collateralDescription?: string;

  @IsOptional()
  @IsNumber()
  collateralValue?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateKycFileDto)
  files?: CreateKycFileDto[];
}
