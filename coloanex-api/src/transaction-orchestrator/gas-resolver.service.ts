import { Injectable } from '@nestjs/common';
import type { GasPaymentMode } from './transaction-orchestrator.types';

@Injectable()
export class GasResolverService {
  resolve(
    platform: 'WEB' | 'APP',
    requestedMode: GasPaymentMode | undefined,
    userMode: GasPaymentMode,
  ) {
    // Mobile app is always platform-paid and never wallet-required.
    if (platform === 'APP') {
      return {
        gasPaymentMode: 'PLATFORM_WALLET' as const,
        gasPayer: 'PLATFORM' as const,
      };
    }

    const normalizedUserMode =
      userMode === 'AUTO' ? 'PLATFORM_WALLET' : userMode;
    const normalizedRequestedMode =
      requestedMode && requestedMode !== 'AUTO'
        ? requestedMode
        : normalizedUserMode;

    if (normalizedRequestedMode === 'PLATFORM_WALLET') {
      return {
        gasPaymentMode: normalizedRequestedMode,
        gasPayer: 'PLATFORM' as const,
      };
    }

    if (normalizedRequestedMode === 'USER_WALLET') {
      return {
        gasPaymentMode: normalizedRequestedMode,
        gasPayer: 'USER' as const,
      };
    }

    return {
      gasPaymentMode: 'PLATFORM_WALLET' as const,
      gasPayer: 'PLATFORM' as const,
    };
  }
}
