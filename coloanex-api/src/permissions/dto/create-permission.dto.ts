import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { CapitalizeFirstLetter } from '../../common/decorators/capitalize-first-letter.decorator';
import { IsUnique } from '../../common/validators/is-unique.validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @CapitalizeFirstLetter()
  @IsUnique('Permission', 'name')
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
