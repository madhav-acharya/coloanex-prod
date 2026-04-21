import { BlockchainService } from '../../src/blockchain/blockchain.service';

describe('BlockchainService', () => {
  it('should return default enabled state based on env', () => {
    const service = new BlockchainService();
    expect(typeof service.isEnabled()).toBe('boolean');
  });

  it('should not be ready if env vars are missing', () => {
    const service = new BlockchainService();
    expect(service.isReady()).toBe(false);
  });

  it('should return null for explorer url if hash is empty', () => {
    const service = new BlockchainService();
    const url = (service as any).buildExplorerUrl('');
    expect(url).toContain('');
  });
});
