import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class LookupPaymentDto {
  @IsString()
  @IsNotEmpty()
  transactionUuid: string;

  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @IsEnum(['KHALTI', 'ESEWA'])
  @IsNotEmpty()
  gateway: 'KHALTI' | 'ESEWA';
}
