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

cc_port() {
  case "${1}" in
    loans)     echo "9999" ;;
    contracts) echo "10000" ;;
    payments)  echo "10001" ;;
    *) echo "Unknown chaincode: ${1}" >&2; exit 1 ;;
  esac
}

get_next_sequence() {
  local CC_NAME="${1}"
  set_org1_peer0_vars
  local COMMITTED
  COMMITTED=$(peer lifecycle chaincode querycommitted \
    --channelID "${CHANNEL_NAME}" \
    --name "${CC_NAME}" 2>/dev/null \
    | sed -n "s/.*Sequence: \([0-9]*\).*/\1/p" | head -1)
  if [ -z "${COMMITTED}" ]; then
    echo "1"
  else
    echo $((COMMITTED + 1))
  fi
}

install_on_peer() {
  local CC_NAME="${1}"
  local PEER_LABEL="${2}"
  peer lifecycle chaincode install "${CC_NAME}.tar.gz" 2>&1 | grep -v "already successfully installed" || true
  echo "Installed/verified ${CC_NAME} on ${PEER_LABEL}"
}

install_chaincode() {
  local CC_NAME="${1}"
  local CC_VERSION="${2:-1.0}"
  local CC_SEQUENCE
  if [ -n "${3}" ]; then
    CC_SEQUENCE="${3}"
  else
    CC_SEQUENCE=$(get_next_sequence "${CC_NAME}")
  fi
  local CC_PORT
  CC_PORT=$(cc_port "${CC_NAME}")

  echo "Building Docker image coloanex-chaincode-${CC_NAME}:latest..."
  docker build --platform linux/amd64 \
    -t "coloanex-chaincode-${CC_NAME}:latest" \
    "${CHAINCODE_DIR}/${CC_NAME}"

  echo "Packaging ${CC_NAME} as CCaaS external chaincode..."
  local CC_PKG_DIR="${NETWORK_DIR}/${CC_NAME}-ccaas-pkg"
  rm -rf "${CC_PKG_DIR}" && mkdir -p "${CC_PKG_DIR}"

  printf '{"address":"chaincode-%s:%d","dial_timeout":"10s","tls_required":false}' \
    "${CC_NAME}" "${CC_PORT}" > "${CC_PKG_DIR}/connection.json"

  cd "${CC_PKG_DIR}"
  tar czf code.tar.gz connection.json
  printf '{"type":"ccaas","label":"%s_%s"}' "${CC_NAME}" "${CC_VERSION}" > metadata.json
  tar czf "${NETWORK_DIR}/${CC_NAME}.tar.gz" metadata.json code.tar.gz

  echo "Installing ${CC_NAME} on all peers..."
  cd "${NETWORK_DIR}"

  set_org1_peer0_vars
  INSTALL_OUT=$(peer lifecycle chaincode install "${CC_NAME}.tar.gz" 2>&1 || true)
  echo "${INSTALL_OUT}" | grep -v "already successfully installed" || true
  PACKAGE_ID=$(echo "${INSTALL_OUT}" | grep "Chaincode code package identifier:" | awk '{print $NF}')

  set_org1_peer1_vars
  install_on_peer "${CC_NAME}" "Org1 peer1"

  set_org2_peer0_vars
  install_on_peer "${CC_NAME}" "Org2 peer0"

  set_org2_peer1_vars
  install_on_peer "${CC_NAME}" "Org2 peer1"

  if [ -z "${PACKAGE_ID}" ]; then
    set_org1_peer0_vars
    PACKAGE_ID=$(peer lifecycle chaincode queryinstalled \
      | grep "Label: ${CC_NAME}_${CC_VERSION}" \
      | sed -n "s/.*Package ID: \([^,]*\).*/\1/p" \\
      | tail -1)
  fi

  echo "Stopping old chaincode container chaincode-${CC_NAME} (if any)..."
  docker rm -f "chaincode-${CC_NAME}" 2>/dev/null || true

  echo "Starting CCaaS container chaincode-${CC_NAME} (id=${PACKAGE_ID})..."
  docker run -d \
    --name "chaincode-${CC_NAME}" \
    --network coloanex_network \
    --label "com.docker.compose.project=coloanex-blockchain" \
    --label "com.docker.compose.service=chaincode-${CC_NAME}" \
    "coloanex-chaincode-${CC_NAME}:latest" \
    node_modules/.bin/fabric-chaincode-node server \
      --chaincode-address "0.0.0.0:${CC_PORT}" \
      --chaincode-id "${PACKAGE_ID}"

  sleep 3

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

  echo "Removing stale dev-peer containers and images for ${CC_NAME}..."
  docker ps -a --format '{{.Names}}' \
    | grep "^dev-peer.*${CC_NAME}" \
    | xargs docker rm -f 2>/dev/null || true
  docker images --format '{{.Repository}}	{{.ID}}' \
    | grep "^dev-peer.*${CC_NAME}" \
    | awk '{print $2}' \
    | xargs docker rmi -f 2>/dev/null || true

  echo "Chaincode ${CC_NAME} deployed successfully in CCaaS mode."
}

deploy_all() {
  install_chaincode "loans" "1.0"
  install_chaincode "contracts" "1.0"
  install_chaincode "payments" "1.0"
}

CC_NAME="${1}"
CC_VERSION="${2:-1.0}"
CC_SEQUENCE="${3:-}"

if [ "${CC_NAME}" = "all" ]; then
  deploy_all
else
  install_chaincode "${CC_NAME}" "${CC_VERSION}" "${CC_SEQUENCE}"
fi
