import { FabricConfig } from "./types";
import { LoanFabricService } from "./services/loan.fabric.service";
import { ContractFabricService } from "./services/contract.fabric.service";
import { PaymentFabricService } from "./services/payment.fabric.service";

export class FabricClientModule {
  readonly loans: LoanFabricService;
  readonly contracts: ContractFabricService;
  readonly payments: PaymentFabricService;

  constructor(config: FabricConfig) {
    this.loans = new LoanFabricService(config.loans);
    this.contracts = new ContractFabricService(config.contracts);
    this.payments = new PaymentFabricService(config.payments);
  }

  async connectAll(): Promise<void> {
    await Promise.all([
      this.loans.connect(),
      this.contracts.connect(),
      this.payments.connect(),
    ]);
  }

  async disconnectAll(): Promise<void> {
    await Promise.all([
      this.loans.disconnect(),
      this.contracts.disconnect(),
      this.payments.disconnect(),
    ]);
  }
}

export { FabricGatewayClient } from "./gateway.client";
export { LoanFabricService } from "./services/loan.fabric.service";
export { ContractFabricService } from "./services/contract.fabric.service";
export { PaymentFabricService } from "./services/payment.fabric.service";
export * from "./types";
