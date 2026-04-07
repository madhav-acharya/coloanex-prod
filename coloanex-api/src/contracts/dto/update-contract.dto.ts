import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ContractStatus } from '../entities/contract.entity';

export class UpdateContractDto {
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @IsOptional()
  @IsString()
  blockchain_tx_hash?: string;
}
