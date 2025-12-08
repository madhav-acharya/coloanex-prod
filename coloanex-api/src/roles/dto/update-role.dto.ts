import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { CapitalizeFirstLetter } from '../../common/decorators/capitalize-first-letter.decorator';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @IsOptional()
  id?: bigint;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @CapitalizeFirstLetter()
  name?: string;
}
