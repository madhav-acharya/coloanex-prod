import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import {
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  IsUrl,
} from 'class-validator';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.password && o.password.trim() !== '')
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;

  @IsOptional()
  @IsUrl()
  @IsString()
  profileImage?: string;
}
