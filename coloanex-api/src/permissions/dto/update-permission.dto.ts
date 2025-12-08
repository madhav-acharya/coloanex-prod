import { PartialType } from '@nestjs/mapped-types';
import { CreatePermissionDto } from './create-permission.dto';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { CapitalizeFirstLetter } from '../../common/decorators/capitalize-first-letter.decorator';

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {
  @IsOptional()
  id?: bigint;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @CapitalizeFirstLetter()
  name?: string;
}
