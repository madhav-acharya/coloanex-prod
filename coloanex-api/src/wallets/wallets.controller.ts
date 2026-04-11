import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateGasModeDto } from './dto/update-gas-mode.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { WalletsService } from './wallets.service';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  create(@Body() dto: CreateWalletDto, @Req() req: any) {
    return this.walletsService.create(req.user.sub, dto);
  }

  @Get('me')
  findMine(@Req() req: any) {
    return this.walletsService.findMine(req.user.sub);
  }

  @Patch('gas-mode')
  updateGasMode(@Body() dto: UpdateGasModeDto, @Req() req: any) {
    return this.walletsService.updateGasPaymentMode(
      req.user.sub,
      dto.gasPaymentMode,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWalletDto,
    @Req() req: any,
  ) {
    return this.walletsService.update(req.user.sub, id, dto);
  }

  @Patch(':id/primary')
  setPrimary(@Param('id') id: string, @Req() req: any) {
    return this.walletsService.setPrimary(req.user.sub, id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.walletsService.remove(req.user.sub, id);
  }
}
