import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from '../../src/payments/payments.service';

describe('PaymentsService', () => {
  it('throws when gateway configuration is missing', async () => {
    delete process.env.ESEWA_MERCHANT_ID;
    delete process.env.ESEWA_SECRET;

    const prisma = {
      contract: {
        findUnique: jest.fn(),
      },
    };

    const paymentConfigsService = {
      resolveGatewayConfigForTransaction: jest.fn().mockResolvedValue(null),
    };

    const service = new PaymentsService(
      prisma as any,
      new Map() as any,
      {} as any,
      paymentConfigsService as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.initiatePayment(
        {
          amount: 10,
          gateway: 'ESEWA',
          successUrl: 'https://success',
          failureUrl: 'https://fail',
          type: 'DEPOSIT',
        } as any,
        { sub: 'user-1', tenantId: 'tenant-1', roles: [] },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
