export interface FabricConnectionProfile {
  channelName: string;
  chaincodeName: string;
  mspId: string;
  peerEndpoint: string;
  peerHostAlias: string;
  tlsCertPath: string;
  certPath: string;
  keyDirectoryPath: string;
}

export interface FabricConfig {
  loans: FabricConnectionProfile;
  contracts: FabricConnectionProfile;
  payments: FabricConnectionProfile;
}

export interface TransactionResult {
  success: boolean;
  data: unknown;
  txId: string;
}
