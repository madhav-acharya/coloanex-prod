import { TransactionOrchestratorService } from '../../src/transaction-orchestrator/transaction-orchestrator.service';

describe('TransactionOrchestratorService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  };
  const subscriptionResolver = { resolveActiveSubscription: jest.fn() };
  const walletResolver = { resolveWallet: jest.fn() };
  const gasResolver = { resolve: jest.fn() };
  const policyEngine = { evaluate: jest.fn() };

  const makeService = () =>
    new TransactionOrchestratorService(
      prisma as any,
      subscriptionResolver as any,
      walletResolver as any,
      gasResolver as any,
      policyEngine as any,
    );

  it('rejects borrower actions on web platform', async () => {
    const service = makeService();
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'u1',
      roles: [{ role: { name: 'Borrower' } }],
    } as any);

    const result = await service.orchestrate({
      userId: 'u1',
      platform: 'WEB',
      transactionType: 'DISBURSEMENT',
    } as any);

    expect(result.eligible).toBe(false);
    expect(result.denialReason).toContain('restricted to the mobile app');
  });
});
