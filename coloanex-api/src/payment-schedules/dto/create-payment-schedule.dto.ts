import { IsString, IsNumber, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentScheduleDto {
  @IsString()
  contractId: string;

  @IsNumber()
  @Min(1)
  installmentNumber: number;

  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @IsNumber()
  @Min(0)
  dueAmount: number;
}
