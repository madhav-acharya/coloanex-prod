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
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import type { TenantsQueryInterface } from './interfaces/tenants.query.interface';
import {
  CREATE_TENANTS,
  UPDATE_TENANTS,
  DELETE_TENANTS,
  READ_TENANTS,
} from 'src/common/constants/permissions.constants';

@Controller('tenants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @RequirePermissions(CREATE_TENANTS)
  create(
    @Body() createTenantDto: CreateTenantDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.tenantsService.create(createTenantDto, currentUser);
  }

  @Get()
  @RequirePermissions(READ_TENANTS)
  findAll(@Query() query: TenantsQueryInterface) {
    return this.tenantsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(READ_TENANTS)
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(UPDATE_TENANTS)
  update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.tenantsService.update(id, updateTenantDto, currentUser);
  }

  @Delete(':id')
  @RequirePermissions(DELETE_TENANTS)
  remove(@Param('id') id: string, @CurrentUser() currentUser: JwtPayload) {
    return this.tenantsService.remove(id, currentUser);
  }
}
