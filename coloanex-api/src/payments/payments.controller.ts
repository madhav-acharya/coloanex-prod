import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Get('khalti/success')
  khaltiSuccess(@Query('target') target: string, @Res() res: Response) {
    const dest = target ? decodeURIComponent(target) : '/';
    res.redirect(302, dest);
  }

  @Public()
  @Get('khalti/failure')
  khaltiFailure(@Query('target') target: string, @Res() res: Response) {
    const dest = target ? decodeURIComponent(target) : '/';
    res.redirect(302, dest);
  }

  @Public()
  @Get('esewa/success')
  esewaSuccess(@Query('target') target: string, @Res() res: Response) {
    const dest = target ? decodeURIComponent(target) : '/';
    res.redirect(302, dest);
  }

  @Public()
  @Get('esewa/failure')
  esewaFailure(@Query('target') target: string, @Res() res: Response) {
    const dest = target ? decodeURIComponent(target) : '/';
    res.redirect(302, dest);
  }

  @Public()
  @Get('esewa-form')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  esewaForm(@Query('data') data: string, @Res() res: Response) {
    let paymentUrl = '';
    let formData: Record<string, string> = {};
    try {
      const parsed = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
      paymentUrl = parsed.paymentUrl;
      formData = parsed.formData;
    } catch {
      res.status(400).send('Invalid data');
      return;
    }
    const fields = Object.entries(formData)
      .map(([k, v]) => `<input type="hidden" name="${k}" value="${v}">`)
      .join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background:#1a1a2e;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;color:#fff}p{font-size:16px;opacity:.7}</style></head><body onload="document.forms[0].submit()"><form method="POST" action="${paymentUrl}">${fields}</form><p>Redirecting to eSewa...</p></body></html>`;
    res.send(html);
  }

  @UseGuards(JwtAuthGuard)
  @Post('initiate')
  initiatePayment(@Body() dto: InitiatePaymentDto, @Req() req: any) {
    return this.paymentsService.initiatePayment(dto, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  verifyPayment(@Body() dto: VerifyPaymentDto, @Req() req: any) {
    return this.paymentsService.verifyPayment(dto, req.user.sub);
  }
}
