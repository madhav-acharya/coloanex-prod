#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRYPTO_DIR="${SCRIPT_DIR}/../coloanex-blockchain/network/crypto-config"

if [ ! -d "${CRYPTO_DIR}" ]; then
  echo "Error: crypto-config directory not found at:"
  echo "  ${CRYPTO_DIR}"
  echo ""
  echo "Start the Fabric network first:"
  echo "  cd ../coloanex-blockchain && npm run network:up"
  exit 1
fi

copy_admin_key() {
  local org_name="${1}"
  local keystore_path="${2}"

  if [ ! -d "${keystore_path}" ]; then
    echo "Error: keystore directory not found: ${keystore_path}"
    return 1
  fi

  local key_file
  key_file=$(find "${keystore_path}" -maxdepth 1 -type f ! -name "priv_sk" | head -1)

  if [ -z "${key_file}" ]; then
    if [ -f "${keystore_path}/priv_sk" ]; then
      echo "[${org_name}] priv_sk already up to date"
      return 0
    fi
    echo "Error: no private key file found in ${keystore_path}"
    return 1
  fi

  cp "${key_file}" "${keystore_path}/priv_sk"
  echo "[${org_name}] Admin private key copied to priv_sk"
}

copy_admin_key "Org1MSP" \
  "${CRYPTO_DIR}/peerOrganizations/org1.coloanex.com/users/Admin@org1.coloanex.com/msp/keystore"

copy_admin_key "Org2MSP" \
  "${CRYPTO_DIR}/peerOrganizations/org2.coloanex.com/users/Admin@org2.coloanex.com/msp/keystore"

echo ""
echo "Setup complete. Run 'npm run up' to start Hyperledger Explorer."
