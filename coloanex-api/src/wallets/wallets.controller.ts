import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  create(
    @Body() createWalletDto: CreateWalletDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.walletsService.create(createWalletDto, req.user);
  }

  @Get('my-wallet')
  findMyWallet(@Request() req: { user: JwtPayload }) {
    return this.walletsService.findByUser(req.user.sub);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.walletsService.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.walletsService.findOne(id);
  }

  @Patch(':id/balance')
  updateBalance(@Param('id') id: string, @Body('amount') amount: number) {
    return this.walletsService.updateBalance(id, amount);
  }
}
