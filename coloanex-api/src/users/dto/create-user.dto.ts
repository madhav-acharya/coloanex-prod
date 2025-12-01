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
  @IsOptional()
  @IsUnique('user', 'email')
  email?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{10}$/, { message: 'Phone must be a 10-digit number' })
  @IsUnique('user', 'phone')
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
  roleIds?: bigint[];

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
}
