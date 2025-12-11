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

  @ValidateIf(
    (o: CreateKycDto) => o.documentTypes?.includes('CITIZENSHIP') ?? false,
  )
  @IsNotEmpty({
    message:
      'Citizenship number is required when CITIZENSHIP document type is selected',
  })
  @IsString()
  citizenshipNumber?: string;

  @ValidateIf(
    (o: CreateKycDto) => o.documentTypes?.includes('CITIZENSHIP') ?? false,
  )
  @IsNotEmpty({
    message:
      'Citizenship issue date is required when CITIZENSHIP document type is selected',
  })
  @IsDateString()
  citizenshipIssueDate?: string;

  @ValidateIf(
    (o: CreateKycDto) => o.documentTypes?.includes('CITIZENSHIP') ?? false,
  )
  @IsNotEmpty({
    message:
      'Citizenship district is required when CITIZENSHIP document type is selected',
  })
  @IsString()
  citizenshipDistrict?: string;

  @ValidateIf(
    (o: CreateKycDto) => o.documentTypes?.includes('PASSPORT') ?? false,
  )
  @IsNotEmpty({
    message:
      'Passport number is required when PASSPORT document type is selected',
  })
  @IsString()
  passportNumber?: string;

  @ValidateIf(
    (o: CreateKycDto) => o.documentTypes?.includes('PASSPORT') ?? false,
  )
  @IsNotEmpty({
    message:
      'Passport issue date is required when PASSPORT document type is selected',
  })
  @IsDateString()
  passportIssueDate?: string;

  @ValidateIf(
    (o: CreateKycDto) => o.documentTypes?.includes('PASSPORT') ?? false,
  )
  @IsNotEmpty({
    message:
      'Passport expiry date is required when PASSPORT document type is selected',
  })
  @IsDateString()
  passportExpiryDate?: string;

  @ValidateIf((o: CreateKycDto) => o.documentTypes?.includes('PAN') ?? false)
  @IsNotEmpty({
    message: 'PAN number is required when PAN document type is selected',
  })
  @IsString()
  panNumber?: string;

  @ValidateIf(
    (o: CreateKycDto) => o.documentTypes?.includes('DRIVING_LICENSE') ?? false,
  )
  @IsNotEmpty({
    message:
      'License number is required when DRIVING_LICENSE document type is selected',
  })
  @IsString()
  licenseNumber?: string;

  @ValidateIf(
    (o: CreateKycDto) => o.documentTypes?.includes('DRIVING_LICENSE') ?? false,
  )
  @IsNotEmpty({
    message:
      'License issue date is required when DRIVING_LICENSE document type is selected',
  })
  @IsDateString()
  licenseIssueDate?: string;

  @ValidateIf(
    (o: CreateKycDto) => o.documentTypes?.includes('DRIVING_LICENSE') ?? false,
  )
  @IsNotEmpty({
    message:
      'License expiry date is required when DRIVING_LICENSE document type is selected',
  })
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
