import { KycService } from '../../src/kyc/kyc.service';

describe('KycService', () => {
  it('returns empty status when borrower not found', async () => {
    const prisma = {
      borrower: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      kyc: {
        findFirst: jest.fn(),
      },
    };

    const service = new KycService(
      prisma as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const result = await service.getStatus({
      sub: 'user-1',
      roles: ['Borrower'],
    } as any);

    expect(result).toEqual({ status: null, hasKyc: false });
    expect(prisma.kyc.findFirst).not.toHaveBeenCalled();
  });
});
