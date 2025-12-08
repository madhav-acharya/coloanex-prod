import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { CapitalizeFirstLetter } from '../../common/decorators/capitalize-first-letter.decorator';
import { IsUnique } from '../../common/validators/is-unique.validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @CapitalizeFirstLetter()
  @IsUnique('Role', 'name')
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsArray()
  permissionIds?: bigint[];
}
