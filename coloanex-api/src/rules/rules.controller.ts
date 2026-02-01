import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RulesService } from './rules.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createRuleDto: CreateRuleDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.rulesService.create(createRuleDto, req.user);
  }

  @Get()
  findAll(@Request() req: { user?: JwtPayload }) {
    return this.rulesService.findAll(req.user);
  }

  @Get('tenant/:tenantId')
  findByTenant(@Param('tenantId') tenantId: string) {
    return this.rulesService.findByTenant(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: { user?: JwtPayload }) {
    return this.rulesService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateRuleDto: UpdateRuleDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.rulesService.update(id, updateRuleDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    return this.rulesService.remove(id, req.user);
  }
}
