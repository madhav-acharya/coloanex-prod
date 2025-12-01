import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { CapitalizeFirstLetter } from '../../common/decorators/capitalize-first-letter.decorator';
import { IsUnique } from '../../common/validators/is-unique.validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @CapitalizeFirstLetter()
  @IsUnique('role', 'name')
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsArray()
  permissionIds?: bigint[];

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;
}
