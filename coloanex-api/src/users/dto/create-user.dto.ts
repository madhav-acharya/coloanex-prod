import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsBoolean,
  MinLength,
  Matches,
  IsUUID,
} from 'class-validator';
import { IsUnique } from '../../common/validators/is-unique.validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  @IsUnique('user', 'email', {
    excludeIdField: 'id',
    excludeIdValuePath: 'id',
  })
  email: string;

  @IsOptional()
  @Matches(/^\d{10}$/, { message: 'Phone must be a 10-digit number' })
  @IsUnique('user', 'phone', {
    excludeIdField: 'id',
    excludeIdValuePath: 'id',
  })
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @IsArray()
  @IsOptional()
  roleIds?: (bigint | string)[];

  @IsArray()
  @IsOptional()
  permissionIds?: bigint[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isBanned?: boolean;

  @IsBoolean()
  @IsOptional()
  isEmailVerified?: boolean;

  @IsString()
  @IsOptional()
  tenantName?: string;

  @IsEmail()
  @IsOptional()
  tenantContactEmail?: string;

  @IsString()
  @IsOptional()
  tenantContactPhone?: string;

  @IsString()
  @IsOptional()
  tenantAddress?: string;
}
