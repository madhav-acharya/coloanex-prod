# Coloanex Blockchain

Hyperledger Fabric v2.5 blockchain layer for the Coloanex lending platform. This module provides tamper-proof, auditable on-chain records for loans, contracts, and payments.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [1. Install Fabric Binaries](#1-install-fabric-binaries)
  - [2. Install Node Dependencies](#2-install-node-dependencies)
  - [3. Start the Network](#3-start-the-network)
  - [4. Deploy Chaincodes](#4-deploy-chaincodes)
- [Network Details](#network-details)
- [Chaincodes](#chaincodes)
  - [Loans](#loans-chaincode)
  - [Contracts](#contracts-chaincode)
  - [Payments](#payments-chaincode)
- [Fabric Client](#fabric-client)
- [Scripts Reference](#scripts-reference)
- [npm Scripts Reference](#npm-scripts-reference)
- [Running Tests](#running-tests)
- [Tearing Down the Network](#tearing-down-the-network)
- [Mac Apple Silicon (M1/M2/M3) Notes](#mac-apple-silicon-m1m2m3-notes)
- [Troubleshooting](#troubleshooting)

---

## Overview

The blockchain layer is a standalone Hyperledger Fabric network with:

- **2 organisations** (Org1, Org2) — each running 2 peers
- **1 orderer** using the Raft consensus algorithm
- **3 Certificate Authorities** (one per org + one for the orderer)
- **3 chaincodes** written in TypeScript (Node.js): `loans`, `contracts`, `payments`
- **1 Fabric Gateway client library** (`fabric-client`) for integration with the NestJS API

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      coloanex-channel                           │
│                                                                 │
│  ┌──────────────────────┐    ┌──────────────────────┐          │
│  │        Org1          │    │        Org2          │          │
│  │  peer0  │  peer1     │    │  peer0  │  peer1     │          │
│  └──────────────────────┘    └──────────────────────┘          │
│                                                                 │
│               ┌─────────────────────┐                          │
│               │   Orderer (Raft)    │                          │
│               └─────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘

Chaincodes deployed on all peers:
  loans      → loan lifecycle management (DRAFT → DISBURSED → CLOSED)
  contracts  → loan contract document management
  payments   → payment recording and status tracking

fabric-client → TypeScript library used by the NestJS API to
                submit/query transactions via the Fabric Gateway SDK
```

---

## Prerequisites

| Tool           | Minimum Version | Notes                       |
| -------------- | --------------- | --------------------------- |
| Docker         | 24+             | Docker Desktop recommended  |
| Docker Compose | v2 (Compose V2) | Bundled with Docker Desktop |
| Node.js        | 18+             | `node --version`            |
| npm            | 9+              | `npm --version`             |

> **Apple Silicon (M1/M2/M3):** Docker must run with Rosetta 2 or use `linux/amd64` emulation. All services are pre-configured for this. See [Mac Apple Silicon Notes](#mac-apple-silicon-m1m2m3-notes).

---

## Project Structure

```
coloanex-blockchain/
├── bin/                        # Fabric binaries (cryptogen, configtxgen, peer, osnadmin…)
├── builders/ccaas/             # Chaincode-as-a-service builder scripts
├── chaincode/
│   ├── loans/                  # Loan lifecycle chaincode (TypeScript)
│   ├── contracts/              # Contract chaincode (TypeScript)
│   └── payments/               # Payment chaincode (TypeScript)
├── config/
│   ├── core.yaml               # Peer core configuration
│   ├── orderer.yaml            # Orderer configuration
│   └── configtx.yaml           # (unused here — see network/)
├── fabric-client/              # Gateway SDK wrapper library (TypeScript)
│   └── src/
│       ├── gateway.client.ts   # Core gRPC + Gateway connection
│       ├── types.ts            # Shared TypeScript interfaces
│       └── services/
│           ├── loan.fabric.service.ts
│           ├── contract.fabric.service.ts
│           └── payment.fabric.service.ts
├── network/
│   ├── configtx.yaml           # Channel & MSP configuration
│   ├── crypto-config.yaml      # Identity generation config
│   ├── docker-compose.yaml     # Orderer + 4 peers
│   ├── docker-compose-ca.yaml  # 3 Fabric CAs
│   ├── channel-artifacts/      # Generated: genesis block (after network up)
│   └── crypto-config/          # Generated: all certs & keys (after network up)
└── scripts/
    ├── network.sh              # Bring network up/down
    ├── deploy-chaincode.sh     # Install, approve, commit chaincode
    ├── utils.sh                # Peer environment variable helpers
    └── install-fabric-binaries.sh  # One-time binary download
```

---

## Getting Started

### 1. Install Fabric Binaries

The `bin/` directory must contain the Fabric CLI tools. Run the install script once:

```bash
cd coloanex-blockchain
chmod +x scripts/install-fabric-binaries.sh
./scripts/install-fabric-binaries.sh
```

This downloads **Fabric v2.5.9** and **Fabric CA v1.5.12** binaries for your platform (automatically detects `arm64` for Apple Silicon).

Add the binaries to your PATH permanently:

```bash
echo 'export PATH="/Users/$(whoami)/coding/coloanex/coloanex-blockchain/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Verify:

```bash
cryptogen version   # should print 2.5.x
configtxgen --version
peer version
```

### 2. Install Node Dependencies

```bash
cd coloanex-blockchain
npm install
```

This installs dependencies for all workspaces (3 chaincodes + fabric-client) in a single command.

### 3. Start the Network

```bash
npm run network:up
# or directly:
./scripts/network.sh up
```

This will:

1. Generate crypto material (certificates and keys) using `cryptogen`
2. Generate the channel genesis block using `configtxgen`
3. Start 3 CA containers, then the orderer + 4 peer containers
4. Create the `coloanex-channel` via the orderer's channel participation API (`osnadmin`)
5. Join all 4 peers to the channel

Expected final output:

```
Network is up and running!
```

You can verify containers are running:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

You should see 9 containers: `ca.org1`, `ca.org2`, `ca.orderer`, `orderer.coloanex.com`, `peer0.org1`, `peer1.org1`, `peer0.org2`, `peer1.org2`.

### 4. Deploy Chaincodes

Each chaincode must be built, packaged, installed on all peers, approved by both orgs, and committed to the channel (Fabric 2.x lifecycle).

Deploy all three:

```bash
npm run deploy:loans
npm run deploy:contracts
npm run deploy:payments
```

Or deploy individually with a custom version and sequence:

```bash
./scripts/deploy-chaincode.sh loans 1.0 1
./scripts/deploy-chaincode.sh contracts 1.0 1
./scripts/deploy-chaincode.sh payments 1.0 1
```

To deploy all at once:

```bash
./scripts/deploy-chaincode.sh all
```

---

## Network Details

| Component   | Container Name            | Port(s)                                      |
| ----------- | ------------------------- | -------------------------------------------- |
| Orderer     | `orderer.coloanex.com`    | `7050` (gRPC), `7053` (admin), `17050` (ops) |
| Org1 Peer 0 | `peer0.org1.coloanex.com` | `7051` (gRPC), `17051` (ops)                 |
| Org1 Peer 1 | `peer1.org1.coloanex.com` | `8051` (gRPC), `17052` (ops)                 |
| Org2 Peer 0 | `peer0.org2.coloanex.com` | `9051` (gRPC), `17053` (ops)                 |
| Org2 Peer 1 | `peer1.org2.coloanex.com` | `10051` (gRPC), `17055` (ops)                |
| CA Org1     | `ca.org1.coloanex.com`    | `7054` (CA), `17054` (ops)                   |
| CA Org2     | `ca.org2.coloanex.com`    | `8054` (CA)                                  |
| CA Orderer  | `ca.orderer.coloanex.com` | `9054` (CA)                                  |

**Channel:** `coloanex-channel`  
**Consensus:** Raft (single-node)  
**TLS:** Enabled everywhere (mutual TLS for orderer admin)

---

## Chaincodes

All chaincodes are TypeScript Node.js chaincodes that implement the `fabric-contract-api` interface. Each asset is stored as a JSON object in the world state (CouchDB-compatible).

### Loans Chaincode

**Location:** `chaincode/loans/`

Manages the full loan lifecycle with enforced state machine transitions.

**Asset: `LoanAsset`**

| Field                 | Type           | Description                  |
| --------------------- | -------------- | ---------------------------- |
| `id`                  | string         | Unique loan ID               |
| `borrowerId`          | string         | Borrower identifier          |
| `tenantId`            | string         | Tenant/lender identifier     |
| `requestedAmount`     | string         | Amount requested by borrower |
| `approvedAmount`      | string \| null | Amount approved by lender    |
| `purpose`             | string         | Loan purpose description     |
| `collateralDetails`   | object         | Collateral information       |
| `requestedTermMonths` | number         | Requested repayment term     |
| `approvedTermMonths`  | number \| null | Approved repayment term      |
| `status`              | LoanStatus     | Current status               |
| `rejectionReason`     | string \| null | Reason if rejected           |

**Status Flow:**

```
DRAFT → PENDING → UNDER_REVIEW → APPROVED → DISBURSED → CLOSED
                              ↘ REJECTED              ↘ DEFAULTED
```

**Chaincode Functions:**

| Function             | Arguments                                               | Description                       |
| -------------------- | ------------------------------------------------------- | --------------------------------- |
| `createLoan`         | `id, tenantId, borrowerId, amount, termMonths, purpose` | Create a new loan in DRAFT status |
| `getLoan`            | `id`                                                    | Retrieve a loan by ID             |
| `updateLoanStatus`   | `id, newStatus`                                         | Transition loan to a new status   |
| `getLoansByBorrower` | `borrowerId`                                            | Query all loans for a borrower    |
| `getLoansByTenant`   | `tenantId`                                              | Query all loans for a tenant      |
| `loanExists`         | `id`                                                    | Check if a loan exists            |

### Contracts Chaincode

**Location:** `chaincode/contracts/`

Manages loan contract documents linked to approved loans.

**Asset: `ContractAsset`**

| Field              | Type           | Description                            |
| ------------------ | -------------- | -------------------------------------- |
| `id`               | string         | Unique contract ID                     |
| `loanId`           | string         | Associated loan ID                     |
| `borrowerId`       | string         | Borrower identifier                    |
| `tenantId`         | string         | Tenant identifier                      |
| `terms`            | string         | Contract terms (text or IPFS hash)     |
| `signedByBorrower` | boolean        | Whether borrower has signed            |
| `signedByLender`   | boolean        | Whether lender has signed              |
| `status`           | ContractStatus | DRAFT / ACTIVE / COMPLETED / CANCELLED |
| `createdAt`        | string         | ISO timestamp                          |
| `updatedAt`        | string         | ISO timestamp                          |

**Chaincode Functions:**

| Function               | Arguments                                 | Description                            |
| ---------------------- | ----------------------------------------- | -------------------------------------- |
| `createContract`       | `id, loanId, borrowerId, tenantId, terms` | Create a new contract                  |
| `getContract`          | `id`                                      | Retrieve a contract by ID              |
| `signContract`         | `id, signerType`                          | Sign contract (`borrower` or `lender`) |
| `updateContractStatus` | `id, status`                              | Update contract status                 |
| `getContractsByLoan`   | `loanId`                                  | Get all contracts for a loan           |

### Payments Chaincode

**Location:** `chaincode/payments/`

Records on-chain payment events tied to loans.

**Asset: `PaymentAsset`**

| Field             | Type           | Description                             |
| ----------------- | -------------- | --------------------------------------- |
| `id`              | string         | Unique payment ID                       |
| `loanId`          | string         | Associated loan ID                      |
| `borrowerId`      | string         | Payer identifier                        |
| `tenantId`        | string         | Tenant identifier                       |
| `amount`          | string         | Payment amount                          |
| `currency`        | string         | Currency code (e.g. `USD`)              |
| `paymentMethod`   | string         | Method used (e.g. `BANK_TRANSFER`)      |
| `status`          | PaymentStatus  | PENDING / COMPLETED / FAILED / REVERSED |
| `transactionHash` | string \| null | External tx hash if available           |
| `paidAt`          | string \| null | ISO timestamp when paid                 |

**Chaincode Functions:**

| Function                | Arguments                                                    | Description                  |
| ----------------------- | ------------------------------------------------------------ | ---------------------------- |
| `createPayment`         | `id, loanId, borrowerId, tenantId, amount, currency, method` | Record a new payment         |
| `getPayment`            | `id`                                                         | Retrieve a payment by ID     |
| `updatePaymentStatus`   | `id, status, txHash?`                                        | Update payment status        |
| `getPaymentsByLoan`     | `loanId`                                                     | Get all payments for a loan  |
| `getPaymentsByBorrower` | `borrowerId`                                                 | Get all payments by borrower |

---

## Fabric Client

**Location:** `fabric-client/`

A TypeScript library that wraps the Hyperledger Fabric Gateway SDK for use in the NestJS API (`coloanex-api`). It abstracts gRPC connections, TLS, identity loading, and transaction submission/query.

**Core class:** `FabricGatewayClient`

```typescript
import { FabricGatewayClient } from 'fabric-client';

const client = new FabricGatewayClient({
  mspId: 'Org1MSP',
  certPath: '/path/to/cert.pem',
  keyPath: '/path/to/key.pem',
  tlsCertPath: '/path/to/tls/ca.crt',
  peerEndpoint: 'localhost:7051',
  peerHostAlias: 'peer0.org1.coloanex.com',
  channelName: 'coloanex-channel',
  chaincodeName: 'loans',
});

await client.connect();
const result = await client.submitTransaction('createLoan', 'loan1', 'tenant1', ...);
await client.disconnect();
```

**Service wrappers** (`fabric-client/src/services/`):

- `LoanFabricService` — typed methods for all loan chaincode functions
- `ContractFabricService` — typed methods for all contract chaincode functions
- `PaymentFabricService` — typed methods for all payment chaincode functions

Build the client library:

```bash
npm run build:client
```

---

## Scripts Reference

### `scripts/network.sh`

```bash
./scripts/network.sh up        # Generate crypto, start containers, create channel, join peers
./scripts/network.sh down      # Stop containers, remove volumes and generated artifacts
./scripts/network.sh restart   # Down then up
./scripts/network.sh generate  # Only generate crypto and channel artifacts (no Docker)
```

### `scripts/deploy-chaincode.sh`

```bash
./scripts/deploy-chaincode.sh <chaincode-name> [version] [sequence]

# Examples:
./scripts/deploy-chaincode.sh loans 1.0 1
./scripts/deploy-chaincode.sh contracts 1.0 1
./scripts/deploy-chaincode.sh payments 1.0 1
./scripts/deploy-chaincode.sh all         # deploys all three
```

The deploy script performs the full Fabric 2.x chaincode lifecycle:

1. `npm install` + `npm run build` (compiles TypeScript)
2. `peer lifecycle chaincode package`
3. `peer lifecycle chaincode install` on all 4 peers
4. `peer lifecycle chaincode approveformyorg` for Org1 and Org2
5. `peer lifecycle chaincode commit`

### `scripts/utils.sh`

Sourced by other scripts. Exports peer CLI environment variables (`CORE_PEER_ADDRESS`, `CORE_PEER_MSPCONFIGPATH`, `CORE_PEER_TLS_*`, etc.) for each peer:

```bash
source scripts/utils.sh
set_org1_peer0_vars   # target peer0 org1
set_org1_peer1_vars   # target peer1 org1
set_org2_peer0_vars   # target peer0 org2
set_org2_peer1_vars   # target peer1 org2
```

### `scripts/install-fabric-binaries.sh`

One-time setup. Downloads platform-specific Hyperledger Fabric binaries into `bin/`:

```bash
./scripts/install-fabric-binaries.sh
```

---

## npm Scripts Reference

Run from the `coloanex-blockchain/` directory:

| Script                              | Description                              |
| ----------------------------------- | ---------------------------------------- |
| `npm run network:up`                | Start the Fabric network                 |
| `npm run network:down`              | Stop the Fabric network                  |
| `npm run network:restart`           | Restart the network                      |
| `npm run network:generate`          | Generate crypto + channel artifacts only |
| `npm run deploy:loans`              | Deploy the loans chaincode               |
| `npm run deploy:contracts`          | Deploy the contracts chaincode           |
| `npm run deploy:payments`           | Deploy the payments chaincode            |
| `npm run deploy:all`                | Deploy all three chaincodes              |
| `npm run build:all`                 | Build all chaincodes + fabric-client     |
| `npm run build:chaincode:loans`     | Build loans chaincode only               |
| `npm run build:chaincode:contracts` | Build contracts chaincode only           |
| `npm run build:chaincode:payments`  | Build payments chaincode only            |
| `npm run build:client`              | Build fabric-client only                 |
| `npm run test:loans`                | Run loans chaincode unit tests           |
| `npm run test:contracts`            | Run contracts chaincode unit tests       |
| `npm run test:payments`             | Run payments chaincode unit tests        |
| `npm run test:all`                  | Run all unit tests                       |

---

## Running Tests

Unit tests use **Jest + ts-jest** with a mocked Fabric stub context — no running network is needed.

```bash
# Run all tests
npm run test:all

# Run individual chaincode tests
npm run test:loans
npm run test:contracts
npm run test:payments
```

Expected results: **41 tests, all passing** (14 loans + 14 contracts + 13 payments).

To run tests from inside a chaincode directory:

```bash
cd chaincode/loans
npm test
```

---

## Tearing Down the Network

```bash
npm run network:down
# or
./scripts/network.sh down
```

This stops and removes all Docker containers, volumes, and the generated `crypto-config/` and `channel-artifacts/` directories. The network can be cleanly restarted with `network:up` afterward.

---

## Mac Apple Silicon (M1/M2/M3) Notes

The network is fully configured for Apple Silicon. The following are already applied — no manual action needed:

- All Docker images use `platform: linux/amd64` (runs via Rosetta 2)
- `DOCKER_DEFAULT_PLATFORM=linux/amd64` is exported in all scripts
- Fabric binaries installed by `install-fabric-binaries.sh` are native `darwin/arm64` (v2.5.9)
- TLS certificates include `localhost` and `127.0.0.1` as Subject Alternative Names so the peer CLI (running on the host) can connect to containers via `localhost`

If Docker is not able to pull `linux/amd64` images, ensure **Rosetta 2** is enabled in Docker Desktop → Settings → General → "Use Rosetta for x86/amd64 emulation on Apple Silicon".

---

## Troubleshooting

**`error: core.yaml not found`**

`FABRIC_CFG_PATH` must point to the `config/` directory. The scripts set this automatically. If calling `peer` manually:

```bash
export FABRIC_CFG_PATH="/path/to/coloanex-blockchain/config"
```

**`no such host: orderer.coloanex.com`**

The peer CLI runs on your host machine and cannot resolve Docker container hostnames. All scripts already use `localhost:7050` with `--ordererTLSHostnameOverride orderer.orderer.coloanex.com`. If you get this error calling `peer` manually, ensure you include both flags.

**`BAD_REQUEST` when joining channel**

This typically means you are running `peer channel create` which does not work in Fabric 2.5 with `ORDERER_CHANNELPARTICIPATION_ENABLED=true`. The correct approach (already used by `network.sh`) is `osnadmin channel join`.

**Port already in use**

Check for leftover containers from a previous run:

```bash
docker ps -a
npm run network:down   # cleans up everything
```

**Chaincode install fails with `context deadline exceeded`**

The network may still be initialising. Wait a few seconds and retry, or increase `DELAY` at the top of `network.sh`.

**Permission denied on scripts**

```bash
chmod +x scripts/*.sh
```
