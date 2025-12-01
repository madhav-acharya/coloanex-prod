import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { CapitalizeFirstLetter } from '../../common/decorators/capitalize-first-letter.decorator';
import { IsUnique } from '../../common/validators/is-unique.validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @CapitalizeFirstLetter()
  @IsUnique('permission', 'name')
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;
}
