# Coloanex Hyperledger Explorer

Hyperledger Explorer is a web-based blockchain browser for the Coloanex Fabric network. It provides a real-time dashboard to inspect blocks, transactions, chaincodes, and channels — giving you full visibility into all on-chain activity for loans, contracts, and payments.

## What You Can See

| Section          | Description                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------- |
| **Dashboard**    | Block height, transaction count, peer count, chaincode count, live charts                |
| **Blocks**       | Every block with its hash, previous hash, timestamp, and transaction list                |
| **Transactions** | Full transaction details — chaincode, function, args (where disclosed), endorsers, tx ID |
| **Chaincodes**   | Deployed chaincodes: `loans`, `contracts`, `payments` with version and channel           |
| **Channels**     | Channel `coloanex-channel` with peer membership and block height                         |
| **Peers**        | All 4 peers across Org1 and Org2 with their ledger height and status                     |

## Network Topology

```
coloanex-channel
│
├── Org1MSP
│   ├── peer0.org1.coloanex.com  :7051
│   └── peer1.org1.coloanex.com  :8051
│
├── Org2MSP
│   ├── peer0.org2.coloanex.com  :9051
│   └── peer1.org2.coloanex.com  :10051
│
└── OrdererMSP
    └── orderer.coloanex.com     :7050  (etcd/Raft)

Chaincodes: loans v1.0  |  contracts v1.0  |  payments v1.0
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  coloanex-blockchain-hlf-explorer                               │
│                                                                 │
│  ┌──────────────────────────┐   ┌──────────────────────────┐   │
│  │ explorer.coloanex.com    │   │ explorerdb.coloanex.com  │   │
│  │ (Node.js + React UI)     │───│ (PostgreSQL)             │   │
│  │ port: 8080               │   │                          │   │
│  └──────────────────────────┘   └──────────────────────────┘   │
│            │  (coloanex_network — shared with Fabric)           │
└────────────│────────────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │  Fabric Network │
    │  (coloanex-blockchain)
    │  peers + orderer│
    └─────────────────┘
```

The Explorer container joins the same Docker network (`coloanex_network`) as the Fabric peers, so it can connect to them directly by container hostname. TLS certificates are mounted read-only from the blockchain project's `crypto-config` folder.

## Prerequisites

- Docker Desktop running
- The Fabric network must be up (`coloanex-blockchain`)
- All three chaincodes must be deployed (`npm run deploy:all` in `coloanex-blockchain`)

## Project Structure

```
coloanex-blockchain-hlf-explorer/
├── config.json                      # Maps network name → connection profile
├── connection-profile/
│   └── coloanex.json                # Full Fabric connection profile (peers, orderer, TLS)
├── docker-compose.yaml              # Starts explorerdb + explorer containers
├── setup.sh                         # Copies admin private keys to known filenames
├── package.json                     # npm convenience scripts
└── README.md
```

## First-Time Setup

### 1. Ensure the Fabric network is running

```bash
cd ../coloanex-blockchain
npm run network:up
npm run deploy:all
```

### 2. Start Hyperledger Explorer

From this directory (`coloanex-blockchain-hlf-explorer`):

```bash
npm run up
```

This runs `setup.sh` (copies admin private keys) and then starts the Docker containers. On first run, Docker will pull the Explorer and PostgreSQL images — this takes a few minutes.

### 3. Open the web UI

```
http://localhost:8080
```

**Login credentials:**

| Field    | Value     |
| -------- | --------- |
| Username | `admin`   |
| Password | `adminpw` |

## npm Commands

| Command           | Description                                       |
| ----------------- | ------------------------------------------------- |
| `npm run up`      | Run setup + start all Explorer containers         |
| `npm run down`    | Stop containers (preserves database)              |
| `npm run reset`   | Stop containers and delete all data (fresh start) |
| `npm run logs`    | Stream Explorer application logs                  |
| `npm run logs:db` | Stream database logs                              |
| `npm run ps`      | Show container status                             |
| `npm run setup`   | Re-run the private key setup script only          |

## After `network:restart`

Every time the Fabric network is restarted (`npm run network:restart` in `coloanex-blockchain`), all crypto material is regenerated. You must re-run the full sequence:

```bash
# 1. In coloanex-blockchain — restart network and redeploy chaincodes
cd ../coloanex-blockchain
npm run network:restart
npm run deploy:all

# 2. In coloanex-blockchain-hlf-explorer — reset and restart Explorer
cd ../coloanex-blockchain-hlf-explorer
npm run reset
npm run up
```

`npm run reset` is required (not just `down`) because Explorer caches blockchain state in the database, which is invalid after the network restart regenerates all block data.

## Configuration Reference

### config.json

Maps the Explorer network name to its connection profile path. The path is relative to where `config.json` is mounted inside the container (`/opt/explorer/app/platform/fabric/`).

### connection-profile/coloanex.json

| Section                       | Description                                         |
| ----------------------------- | --------------------------------------------------- |
| `client.tlsEnable`            | Enables mutual TLS when connecting to peers         |
| `client.adminCredential`      | Web UI login credentials (`admin` / `adminpw`)      |
| `client.enableAuthentication` | Requires login before accessing the UI              |
| `client.organization`         | The MSP Explorer uses to submit queries (`Org1MSP`) |
| `channels`                    | Lists all peers in `coloanex-channel`               |
| `organizations`               | MSP IDs, admin cert paths, and admin key paths      |
| `peers`                       | gRPCS URLs and TLS CA cert paths for each peer      |
| `orderers`                    | gRPCS URL and TLS CA cert path for the orderer      |

### docker-compose.yaml

| Variable                 | Value                     | Description                                |
| ------------------------ | ------------------------- | ------------------------------------------ |
| `DATABASE_HOST`          | `explorerdb.coloanex.com` | PostgreSQL container hostname              |
| `DATABASE_DATABASE`      | `fabricexplorer`          | Database name                              |
| `DATABASE_USERNAME`      | `hppoc`                   | Database user                              |
| `DATABASE_PASSWD`        | `password`                | Database password (Explorer app)           |
| `DISCOVERY_AS_LOCALHOST` | `false`                   | Use actual Docker hostnames, not localhost |
| `LOG_LEVEL_APP`          | `info`                    | Change to `debug` for verbose output       |

### Changing the Web UI Port

Edit `docker-compose.yaml` and change the `ports` mapping under `explorer`:

```yaml
ports:
  - 9090:8080 # Maps host port 9090 → container port 8080
```

## How TLS Works

When `network:restart` runs, `cryptogen` generates fresh TLS certificates for every peer and the orderer. Explorer needs to present the correct CA certificate when connecting over TLS.

The entire `crypto-config` folder is mounted read-only into the Explorer container at `/crypto-config`. The connection profile points to the exact TLS CA cert for each peer and the orderer using their mounted paths.

### Why setup.sh Is Needed

`cryptogen` writes each identity's private key with a hash-based filename (e.g., `a3f8c1...key`). Because this filename changes every time the network is regenerated, the connection profile cannot hardcode it. `setup.sh` finds the actual key file in each admin's keystore and copies it to a fixed filename (`priv_sk`) that the connection profile references.

## Ports Used

| Port   | Service                                 |
| ------ | --------------------------------------- |
| `8080` | Hyperledger Explorer web UI             |
| `5432` | PostgreSQL (internal only, not exposed) |

## Viewing Blockchain Data for Coloanex

Once logged in, you can verify blockchain activity:

**Check if loans are being recorded:**

- Go to **Transactions** → filter by chaincode `loans`
- Each transaction corresponds to a loan creation, approval, or status update
- The transaction ID matches the `blockchain_tx_hash` stored in the Coloanex database

**Check contracts:**

- Filter transactions by chaincode `contracts`
- You can see sign, disburse, and report events on-chain

**Check payments:**

- Filter by chaincode `payments` to see every payment submission

**Verify a specific transaction:**

1. Copy the `blockchainTxHash` from the Coloanex API response
2. Paste it into the Explorer search bar
3. You will see the full transaction detail confirming it was committed to the ledger

## Troubleshooting

**Explorer fails to start / keeps restarting**

Check logs:

```bash
npm run logs
```

Common causes:

- The Fabric network is down — start it first with `npm run network:up` in `coloanex-blockchain`
- `priv_sk` files are missing or stale — run `npm run setup` then `npm run up` again
- The `coloanex_network` Docker network does not exist — it is created by `npm run network:up`

**Database connection error**

```bash
npm run logs:db
```

If the DB is stuck initializing, reset the database volume:

```bash
npm run reset
npm run up
```

**"Channel not found" or empty dashboard after network restart**

The database has stale block data from the previous network run. Always use `npm run reset` (not `npm run down`) after `network:restart`.

**Cannot connect to peer / TLS handshake failed**

This usually means the crypto-config was regenerated but the Explorer containers still have a cached state. Run:

```bash
npm run reset && npm run up
```

**Port 8080 already in use**

Change the port mapping in `docker-compose.yaml`:

```yaml
ports:
  - 8090:8080
```

Then access the UI at `http://localhost:8090`.

## Security Note

The Explorer is configured with authentication enabled. The default credentials (`admin`/`adminpw`) are suitable for local development only. Do not expose port `8080` publicly in a production environment without changing the credentials in `connection-profile/coloanex.json` under `client.adminCredential`.
