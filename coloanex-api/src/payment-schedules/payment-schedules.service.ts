import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { PaymentSchedule } from './entities/payment-schedule.entity';

@Injectable()
export class PaymentSchedulesService {
  constructor(private prisma: PrismaService) {}

  async findByContract(contractId: string): Promise<PaymentSchedule[]> {
    return await this.prisma.paymentSchedule.findMany({
      where: { contractId },
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            borrowerId: true,
            tenantId: true,
          },
        },
      },
      orderBy: { installmentNumber: 'asc' },
    }) as unknown as PaymentSchedule[];
  }

  async findOne(id: string): Promise<PaymentSchedule> {
    const schedule = await this.prisma.paymentSchedule.findUnique({
      where: { id },
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            borrowerId: true,
            tenantId: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Payment schedule not found');
    }

    return schedule as unknown as PaymentSchedule;
  }
}
