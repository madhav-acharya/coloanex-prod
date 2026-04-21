import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsUUID,
  Matches,
} from 'class-validator';
import { IsUnique } from '../../common/validators/is-unique.validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @IsUnique('tenant', 'name', {
    excludeIdField: 'id',
    excludeIdValuePath: 'id',
  })
  name!: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isBanned?: boolean;

  @IsEmail()
  @IsNotEmpty()
  contactEmail!: string;

  @IsNotEmpty()
  @Matches(/^\d{10,20}$/, {
    message: 'Contact phone must be between 10 and 20 digits',
  })
  contactPhone!: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsUUID()
  @IsNotEmpty()
  ownerUserId!: string;
}
