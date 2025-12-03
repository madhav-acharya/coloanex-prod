import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import type { PermissionsQueryInterface } from './interfaces/permissions.query.interface';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import {
  READ_PERMISSIONS,
  CREATE_PERMISSIONS,
  UPDATE_PERMISSIONS,
  DELETE_PERMISSIONS,
} from 'src/common/constants/permissions.constants';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

@UseGuards(PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @RequirePermissions(CREATE_PERMISSIONS)
  create(
    @Body() createPermissionDto: CreatePermissionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.permissionsService.create(createPermissionDto, user);
  }

  @Get()
  @RequirePermissions(READ_PERMISSIONS)
  findAll(@Query() query: PermissionsQueryInterface) {
    return this.permissionsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(READ_PERMISSIONS)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findOne(BigInt(id));
  }

  @Patch(':id')
  @RequirePermissions(UPDATE_PERMISSIONS)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.permissionsService.update(
      BigInt(id),
      updatePermissionDto,
      user,
    );
  }

  @Delete(':id')
  @RequirePermissions(DELETE_PERMISSIONS)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.permissionsService.remove(BigInt(id), user);
  }

  @Post(':roleId/assign')
  @RequirePermissions(UPDATE_PERMISSIONS)
  assignPermissionsToRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() permissionIds: bigint[],
    @CurrentUser() user: JwtPayload,
  ) {
    return this.permissionsService.assignPermissionsToRole(
      BigInt(roleId),
      permissionIds,
      user,
    );
  }
}
