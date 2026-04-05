export const CONTRACT_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'contractId', type: 'string' },
      { internalType: 'string', name: 'loanId', type: 'string' },
      { internalType: 'uint256', name: 'loanAmount', type: 'uint256' },
      { internalType: 'uint256', name: 'interestRate', type: 'uint256' },
      { internalType: 'uint256', name: 'termMonths', type: 'uint256' },
      { internalType: 'uint256', name: 'totalAmountDue', type: 'uint256' },
    ],
    name: 'createContract',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'contractId', type: 'string' }],
    name: 'signContract',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'contractId', type: 'string' }],
    name: 'getContract',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'contractId', type: 'string' },
          { internalType: 'string', name: 'loanId', type: 'string' },
          { internalType: 'uint256', name: 'loanAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'interestRate', type: 'uint256' },
          { internalType: 'uint256', name: 'termMonths', type: 'uint256' },
          { internalType: 'uint256', name: 'totalAmountDue', type: 'uint256' },
          { internalType: 'bool', name: 'signed', type: 'bool' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'uint256', name: 'signedAt', type: 'uint256' },
        ],
        internalType: 'struct ContractRegistry.LoanContract',
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
        name: 'contractId',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'loanId',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'loanAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'totalAmountDue',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'ContractCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'string',
        name: 'contractId',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'ContractSigned',
    type: 'event',
  },
] as const;
