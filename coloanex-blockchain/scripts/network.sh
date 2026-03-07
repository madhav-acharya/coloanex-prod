#!/bin/bash

set -e

export DOCKER_DEFAULT_PLATFORM=linux/amd64

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="${SCRIPT_DIR}/../network"
CHANNEL_NAME="coloanex-channel"
DELAY=5

export PATH="${SCRIPT_DIR}/../bin:$PATH"
export FABRIC_CFG_PATH="${SCRIPT_DIR}/../config"
CONFIGTX_PATH="${NETWORK_DIR}"

ORDERER_ADMIN_CA="${NETWORK_DIR}/crypto-config/ordererOrganizations/orderer.coloanex.com/orderers/orderer.orderer.coloanex.com/tls/ca.crt"
ORDERER_ADMIN_CERT="${NETWORK_DIR}/crypto-config/ordererOrganizations/orderer.coloanex.com/users/Admin@orderer.coloanex.com/tls/client.crt"
ORDERER_ADMIN_KEY="${NETWORK_DIR}/crypto-config/ordererOrganizations/orderer.coloanex.com/users/Admin@orderer.coloanex.com/tls/client.key"

source "${SCRIPT_DIR}/utils.sh"

generate_crypto() {
  echo "Generating crypto material..."
  cryptogen generate --config="${NETWORK_DIR}/crypto-config.yaml" --output="${NETWORK_DIR}/crypto-config"
  echo "Crypto material generated."
}

generate_channel_block() {
  echo "Generating channel genesis block..."
  mkdir -p "${NETWORK_DIR}/channel-artifacts"
  configtxgen --configPath "${CONFIGTX_PATH}" \
    -profile ColoanexChannel \
    -outputBlock "${NETWORK_DIR}/channel-artifacts/${CHANNEL_NAME}.block" \
    -channelID "${CHANNEL_NAME}"
  echo "Channel genesis block generated."
}

start_network() {
  echo "Starting Hyperledger Fabric network..."
  docker-compose -f "${NETWORK_DIR}/docker-compose-ca.yaml" up -d
  sleep "$DELAY"
  docker-compose -f "${NETWORK_DIR}/docker-compose.yaml" up -d
  echo "Network started."
}

stop_network() {
  echo "Stopping Hyperledger Fabric network..."
  docker-compose -f "${NETWORK_DIR}/docker-compose.yaml" down --volumes --remove-orphans
  docker-compose -f "${NETWORK_DIR}/docker-compose-ca.yaml" down --volumes --remove-orphans
  echo "Network stopped."
}

create_channel() {
  echo "Joining orderer to channel ${CHANNEL_NAME} via channel participation API..."
  osnadmin channel join \
    --channelID "${CHANNEL_NAME}" \
    --config-block "${NETWORK_DIR}/channel-artifacts/${CHANNEL_NAME}.block" \
    -o localhost:7053 \
    --ca-file "${ORDERER_ADMIN_CA}" \
    --client-cert "${ORDERER_ADMIN_CERT}" \
    --client-key "${ORDERER_ADMIN_KEY}"
  echo "Orderer joined channel."
}

join_channel() {
  echo "Joining peers to channel ${CHANNEL_NAME}..."

  set_org1_peer0_vars
  peer channel join -b "${NETWORK_DIR}/channel-artifacts/${CHANNEL_NAME}.block"

  set_org1_peer1_vars
  peer channel join -b "${NETWORK_DIR}/channel-artifacts/${CHANNEL_NAME}.block"

  set_org2_peer0_vars
  peer channel join -b "${NETWORK_DIR}/channel-artifacts/${CHANNEL_NAME}.block"

  set_org2_peer1_vars
  peer channel join -b "${NETWORK_DIR}/channel-artifacts/${CHANNEL_NAME}.block"

  echo "All peers joined channel."
}

network_up() {
  generate_crypto
  generate_channel_block
  start_network
  sleep "$DELAY"
  create_channel
  sleep 2
  join_channel
  echo "Network is up and running!"
}

network_down() {
  stop_network
  rm -rf "${NETWORK_DIR}/crypto-config" "${NETWORK_DIR}/channel-artifacts"
  echo "Network brought down and artifacts removed."
}

MODE="${1}"

case "${MODE}" in
  up)
    network_up
    ;;
  down)
    network_down
    ;;
  restart)
    network_down
    network_up
    ;;
  generate)
    generate_crypto
    generate_channel_block
    ;;
  *)
    echo "Usage: $0 {up|down|restart|generate}"
    exit 1
    ;;
esac
