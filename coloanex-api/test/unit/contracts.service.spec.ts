import { ContractsService } from '../../src/contracts/contracts.service';

describe('ContractsService', () => {
  it('calculates installments for monthly payments', () => {
    const service = new ContractsService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const result = (service as any).calculateInstallments(
      10000,
      12,
      12,
      'MONTHLY',
    );

    expect(result.totalInstallments).toBe(12);
    expect(result.totalAmountDue).toBe(11200);
    expect(result.installmentAmount).toBeCloseTo(933.33, 2);
  });
});
