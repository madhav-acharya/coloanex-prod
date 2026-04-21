import { TransactionsService } from '../../src/transactions/transactions.service';

describe('TransactionsService', () => {
  const prisma = {};
  const blockchainService = {};
  const transactionOrchestrator = {};
  const subscriptionResolver = {};

  const makeService = () =>
    new TransactionsService(
      prisma as any,
      blockchainService as any,
      transactionOrchestrator as any,
      subscriptionResolver as any,
    );

  it('resolves platform as APP for Borrower role', () => {
    const service = makeService();
    const platform = (service as any).resolvePlatform({
      roles: ['Borrower'],
    });
    expect(platform).toBe('APP');
  });

  it('resolves platform as WEB for non-Borrower roles', () => {
    const service = makeService();
    const platform = (service as any).resolvePlatform({
      roles: ['Lender'],
    });
    expect(platform).toBe('WEB');
  });
});
