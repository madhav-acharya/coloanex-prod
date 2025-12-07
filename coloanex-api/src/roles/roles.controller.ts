import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import type { RolesQueryInterface } from './interfaces/roles.query.interface';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import {
  READ_ROLES,
  CREATE_ROLES,
  UPDATE_ROLES,
  DELETE_ROLES,
} from 'src/common/constants/permissions.constants';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermissions(CREATE_ROLES)
  create(
    @Body() createRoleDto: CreateRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rolesService.create(createRoleDto, user);
  }

  @Get()
  @RequirePermissions(READ_ROLES)
  findAll(@Query() query: RolesQueryInterface) {
    return this.rolesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(READ_ROLES)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(BigInt(id));
  }

  @Patch(':id')
  @RequirePermissions(UPDATE_ROLES)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rolesService.update(BigInt(id), updateRoleDto, user);
  }

  @Delete(':id')
  @RequirePermissions(DELETE_ROLES)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rolesService.remove(BigInt(id), user);
  }
}
