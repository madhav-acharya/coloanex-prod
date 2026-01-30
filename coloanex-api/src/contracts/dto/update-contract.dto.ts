import { IsEnum, IsOptional } from 'class-validator';
import { ContractStatus } from '../entities/contract.entity';

export class UpdateContractDto {
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;
}
