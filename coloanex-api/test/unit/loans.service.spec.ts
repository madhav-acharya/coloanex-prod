import { BadRequestException } from '@nestjs/common';
import { LoansService } from '../../src/loans/loans.service';

describe('LoansService', () => {
  it('rejects checkExistingLoan for non-borrower roles', async () => {
    const service = new LoansService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.checkExistingLoan('tenant-1', {
        sub: 'user-1',
        roles: ['Admin'],
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
