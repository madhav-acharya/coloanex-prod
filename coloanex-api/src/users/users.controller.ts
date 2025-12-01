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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { UsersQueryInterface } from './interfaces/users.query.interface';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import {
  READ_USERS,
  CREATE_USERS,
  UPDATE_USERS,
  DELETE_USERS,
} from 'src/common/constants/permissions.constants';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

@UseGuards(PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions(CREATE_USERS)
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.create(createUserDto, user);
  }

  @Get()
  @RequirePermissions(READ_USERS)
  findAll(
    @Query() query: UsersQueryInterface,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.findAll(query, user);
  }

  @Get(':id')
  @RequirePermissions(READ_USERS)
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions(UPDATE_USERS)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.update(id, updateUserDto, user);
  }

  @Delete(':id')
  @RequirePermissions(DELETE_USERS)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.remove(id, user);
  }

  @Post(':id/ban')
  @RequirePermissions(UPDATE_USERS)
  banUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.banUser(id, user);
  }

  @Post(':id/unban')
  @RequirePermissions(UPDATE_USERS)
  unbanUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.unbanUser(id, user);
  }

  @Post(':id/activate')
  @RequirePermissions(UPDATE_USERS)
  activateUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.activateUser(id, user);
  }

  @Post(':id/deactivate')
  @RequirePermissions(UPDATE_USERS)
  deactivateUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.deactivateUser(id, user);
  }
}
