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
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import { DisburseContractDto } from './dto/disburse-contract.dto';
import { SignAndDisburseContractDto } from './dto/sign-and-disburse-contract.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  create(
    @Body() createContractDto: CreateContractDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.contractsService.create(createContractDto, req.user);
  }

  @Get()
  findAll(@Request() req: { user: JwtPayload }) {
    return this.contractsService.findAll(req.user);
  }




  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    return this.contractsService.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateContractDto: UpdateContractDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.contractsService.update(id, updateContractDto, req.user);
  }

  @Post(':id/generate')
  generatePdf(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    return this.contractsService.generateContractPdf(id, req.user);
  }

  @Post(':id/sign')
  sign(
    @Param('id') id: string,
    @Body() signContractDto: SignContractDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.contractsService.signContract(id, signContractDto, req.user);
  }

  @Post(':id/sign-and-disburse')
  signAndDisburse(
    @Param('id') id: string,
    @Body() dto: SignAndDisburseContractDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.contractsService.signAndDisburse(id, dto, req.user);
  }

  @Post(':id/report')
  report(
    @Param('id') id: string,
    @Body() body: { reportReason: string },
    @Request() req: { user: JwtPayload },
  ) {
    return this.contractsService.reportContract(
      id,
      body.reportReason,
      req.user,
    );
  }

  @Post(':id/disburse')
  disburse(
    @Param('id') id: string,
    @Body() disburseContractDto: DisburseContractDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.contractsService.disburse(id, disburseContractDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    return this.contractsService.remove(id, req.user);
  }
}
