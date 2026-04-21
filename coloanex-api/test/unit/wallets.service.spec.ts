import { ForbiddenException } from '@nestjs/common';
import { WalletsService } from '../../src/wallets/wallets.service';

describe('WalletsService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const makeService = () => new WalletsService(prisma as any);

  it('forbids wallet management for borrowers', async () => {
    const service = makeService();
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'u1',
      roles: [{ role: { name: 'Borrower' } }],
    } as any);

    await expect(
      (service as any).ensureWalletManagementAllowed('u1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
