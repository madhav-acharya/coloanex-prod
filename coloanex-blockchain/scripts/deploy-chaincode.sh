#!/bin/bash

set -e

export DOCKER_DEFAULT_PLATFORM=linux/amd64

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="${SCRIPT_DIR}/../network"
CHAINCODE_DIR="${SCRIPT_DIR}/../chaincode"
CHANNEL_NAME="coloanex-channel"

export PATH="${SCRIPT_DIR}/../bin:$PATH"
export FABRIC_CFG_PATH="${SCRIPT_DIR}/../config"

source "${SCRIPT_DIR}/utils.sh"

ORDERER_TLS_CA="${NETWORK_DIR}/crypto-config/ordererOrganizations/orderer.coloanex.com/orderers/orderer.orderer.coloanex.com/tls/ca.crt"

install_chaincode() {
  local CC_NAME="${1}"
  local CC_PATH="${CHAINCODE_DIR}/${CC_NAME}"
  local CC_VERSION="${2:-1.0}"
  local CC_SEQUENCE="${3:-1}"

  echo "Building chaincode ${CC_NAME}..."
  cd "${CC_PATH}"
  npm install
  npm run build

  echo "Packaging chaincode ${CC_NAME}..."
  cd "${NETWORK_DIR}"
  peer lifecycle chaincode package "${CC_NAME}.tar.gz" \
    --path "${CC_PATH}" \
    --lang node \
    --label "${CC_NAME}_${CC_VERSION}"

  echo "Installing ${CC_NAME} on Org1 peer0..."
  set_org1_peer0_vars
  peer lifecycle chaincode install "${CC_NAME}.tar.gz"

  echo "Installing ${CC_NAME} on Org1 peer1..."
  set_org1_peer1_vars
  peer lifecycle chaincode install "${CC_NAME}.tar.gz"

  echo "Installing ${CC_NAME} on Org2 peer0..."
  set_org2_peer0_vars
  peer lifecycle chaincode install "${CC_NAME}.tar.gz"

  echo "Installing ${CC_NAME} on Org2 peer1..."
  set_org2_peer1_vars
  peer lifecycle chaincode install "${CC_NAME}.tar.gz"

  PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep "${CC_NAME}_${CC_VERSION}" | awk '{print $3}' | tr -d ',')

  echo "Approving ${CC_NAME} for Org1..."
  set_org1_peer0_vars
  peer lifecycle chaincode approveformyorg \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.orderer.coloanex.com \
    --channelID "${CHANNEL_NAME}" \
    --name "${CC_NAME}" \
    --version "${CC_VERSION}" \
    --package-id "${PACKAGE_ID}" \
    --sequence "${CC_SEQUENCE}" \
    --tls \
    --cafile "${ORDERER_TLS_CA}"

  echo "Approving ${CC_NAME} for Org2..."
  set_org2_peer0_vars
  peer lifecycle chaincode approveformyorg \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.orderer.coloanex.com \
    --channelID "${CHANNEL_NAME}" \
    --name "${CC_NAME}" \
    --version "${CC_VERSION}" \
    --package-id "${PACKAGE_ID}" \
    --sequence "${CC_SEQUENCE}" \
    --tls \
    --cafile "${ORDERER_TLS_CA}"

  echo "Committing ${CC_NAME}..."
  set_org1_peer0_vars
  peer lifecycle chaincode commit \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.orderer.coloanex.com \
    --channelID "${CHANNEL_NAME}" \
    --name "${CC_NAME}" \
    --version "${CC_VERSION}" \
    --sequence "${CC_SEQUENCE}" \
    --tls \
    --cafile "${ORDERER_TLS_CA}" \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles "${NETWORK_DIR}/crypto-config/peerOrganizations/org1.coloanex.com/peers/peer0.org1.coloanex.com/tls/ca.crt" \
    --peerAddresses localhost:9051 \
    --tlsRootCertFiles "${NETWORK_DIR}/crypto-config/peerOrganizations/org2.coloanex.com/peers/peer0.org2.coloanex.com/tls/ca.crt"

  echo "Chaincode ${CC_NAME} deployed successfully."
}

deploy_all() {
  install_chaincode "loans" "1.0" "1"
  install_chaincode "contracts" "1.0" "1"
  install_chaincode "payments" "1.0" "1"
}

CC_NAME="${1}"
CC_VERSION="${2:-1.0}"
CC_SEQUENCE="${3:-1}"

if [ "${CC_NAME}" = "all" ]; then
  deploy_all
else
  install_chaincode "${CC_NAME}" "${CC_VERSION}" "${CC_SEQUENCE}"
fi
