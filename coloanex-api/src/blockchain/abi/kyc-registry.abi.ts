export const KYC_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'kycId', type: 'string' },
      { internalType: 'address', name: 'user', type: 'address' },
      { internalType: 'string', name: 'status', type: 'string' },
      { internalType: 'string', name: 'verifiedBy', type: 'string' },
    ],
    name: 'verifyKYC',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'kycId', type: 'string' },
      { internalType: 'string', name: 'status', type: 'string' },
    ],
    name: 'updateKYCStatus',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'kycId', type: 'string' }],
    name: 'getKYC',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'kycId', type: 'string' },
          { internalType: 'address', name: 'user', type: 'address' },
          { internalType: 'string', name: 'status', type: 'string' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
          { internalType: 'string', name: 'verifiedBy', type: 'string' },
        ],
        internalType: 'struct KYCRegistry.KYCRecord',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getUserKYCs',
    outputs: [{ internalType: 'string[]', name: '', type: 'string[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'string',
        name: 'kycId',
        type: 'string',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'status',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'KYCVerified',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'string',
        name: 'kycId',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'status',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'KYCStatusUpdated',
    type: 'event',
  },
];
