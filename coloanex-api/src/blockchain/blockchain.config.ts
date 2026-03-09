import * as path from 'path';
import type { FabricConfig } from 'coloanex-fabric-client';

const NETWORK_DIR = process.env.FABRIC_NETWORK_DIR
  ? path.resolve(process.env.FABRIC_NETWORK_DIR)
  : path.resolve(__dirname, '../../..', 'coloanex-blockchain/network');

const ORG1_MSP_ID = 'Org1MSP';
const CHANNEL_NAME = process.env.FABRIC_CHANNEL_NAME || 'coloanex-channel';

function org1ConnectionProfile(chaincodeName: string) {
  return {
    channelName: CHANNEL_NAME,
    chaincodeName,
    mspId: ORG1_MSP_ID,
    peerEndpoint: process.env.FABRIC_PEER_ENDPOINT || 'localhost:7051',
    peerHostAlias:
      process.env.FABRIC_PEER_HOST_ALIAS || 'peer0.org1.coloanex.com',
    tlsCertPath: path.join(
      NETWORK_DIR,
      'crypto-config/peerOrganizations/org1.coloanex.com/peers/peer0.org1.coloanex.com/tls/ca.crt',
    ),
    certPath: path.join(
      NETWORK_DIR,
      'crypto-config/peerOrganizations/org1.coloanex.com/users/Admin@org1.coloanex.com/msp/signcerts/Admin@org1.coloanex.com-cert.pem',
    ),
    keyDirectoryPath: path.join(
      NETWORK_DIR,
      'crypto-config/peerOrganizations/org1.coloanex.com/users/Admin@org1.coloanex.com/msp/keystore',
    ),
  };
}

export function buildFabricConfig(): FabricConfig {
  return {
    loans: org1ConnectionProfile(process.env.FABRIC_CHAINCODE_LOANS || 'loans'),
    contracts: org1ConnectionProfile(
      process.env.FABRIC_CHAINCODE_CONTRACTS || 'contracts',
    ),
    payments: org1ConnectionProfile(
      process.env.FABRIC_CHAINCODE_PAYMENTS || 'payments',
    ),
  };
}
