export const PAYMENT_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'paymentId', type: 'string' },
      { internalType: 'string', name: 'contractId', type: 'string' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'string', name: 'paymentMethod', type: 'string' },
      { internalType: 'string', name: 'gatewayRef', type: 'string' },
    ],
    name: 'recordPayment',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'transactionId', type: 'string' },
      { internalType: 'string', name: 'status', type: 'string' },
    ],
    name: 'updateTransaction',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'paymentId', type: 'string' }],
    name: 'getPayment',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'paymentId', type: 'string' },
          { internalType: 'string', name: 'contractId', type: 'string' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
          { internalType: 'string', name: 'paymentMethod', type: 'string' },
          { internalType: 'string', name: 'gatewayRef', type: 'string' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
        ],
        internalType: 'struct PaymentRegistry.Payment',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'string',
        name: 'paymentId',
        type: 'string',
      },
      {
        indexed: true,
        internalType: 'string',
        name: 'contractId',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'paymentMethod',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'gatewayRef',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'PaymentRecorded',
    type: 'event',
  },
] as const;
