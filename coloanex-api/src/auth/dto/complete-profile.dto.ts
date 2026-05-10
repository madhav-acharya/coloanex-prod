import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class CompleteProfileDto {
  @IsEnum(['LENDER', 'BORROWER'])
  role: 'LENDER' | 'BORROWER';

  @IsString()
  @IsNotEmpty()
  phone: string;
}
