#!/bin/bash

NETWORK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/../network" 2>/dev/null && pwd || echo "$(dirname "$(realpath "${BASH_SOURCE[0]:-$0}")")/../network")"

export ORDERER_CA="${NETWORK_DIR}/crypto-config/ordererOrganizations/orderer.coloanex.com/orderers/orderer.orderer.coloanex.com/tls/ca.crt"

set_org1_peer0_vars() {
  export CORE_PEER_TLS_ENABLED=true
  export CORE_PEER_LOCALMSPID="Org1MSP"
  export CORE_PEER_TLS_ROOTCERT_FILE="${NETWORK_DIR}/crypto-config/peerOrganizations/org1.coloanex.com/peers/peer0.org1.coloanex.com/tls/ca.crt"
  export CORE_PEER_MSPCONFIGPATH="${NETWORK_DIR}/crypto-config/peerOrganizations/org1.coloanex.com/users/Admin@org1.coloanex.com/msp"
  export CORE_PEER_ADDRESS="localhost:7051"
}

set_org1_peer1_vars() {
  export CORE_PEER_TLS_ENABLED=true
  export CORE_PEER_LOCALMSPID="Org1MSP"
  export CORE_PEER_TLS_ROOTCERT_FILE="${NETWORK_DIR}/crypto-config/peerOrganizations/org1.coloanex.com/peers/peer1.org1.coloanex.com/tls/ca.crt"
  export CORE_PEER_MSPCONFIGPATH="${NETWORK_DIR}/crypto-config/peerOrganizations/org1.coloanex.com/users/Admin@org1.coloanex.com/msp"
  export CORE_PEER_ADDRESS="localhost:8051"
}

set_org2_peer0_vars() {
  export CORE_PEER_TLS_ENABLED=true
  export CORE_PEER_LOCALMSPID="Org2MSP"
  export CORE_PEER_TLS_ROOTCERT_FILE="${NETWORK_DIR}/crypto-config/peerOrganizations/org2.coloanex.com/peers/peer0.org2.coloanex.com/tls/ca.crt"
  export CORE_PEER_MSPCONFIGPATH="${NETWORK_DIR}/crypto-config/peerOrganizations/org2.coloanex.com/users/Admin@org2.coloanex.com/msp"
  export CORE_PEER_ADDRESS="localhost:9051"
}

set_org2_peer1_vars() {
  export CORE_PEER_TLS_ENABLED=true
  export CORE_PEER_LOCALMSPID="Org2MSP"
  export CORE_PEER_TLS_ROOTCERT_FILE="${NETWORK_DIR}/crypto-config/peerOrganizations/org2.coloanex.com/peers/peer1.org2.coloanex.com/tls/ca.crt"
  export CORE_PEER_MSPCONFIGPATH="${NETWORK_DIR}/crypto-config/peerOrganizations/org2.coloanex.com/users/Admin@org2.coloanex.com/msp"
  export CORE_PEER_ADDRESS="localhost:10051"
}

verify_result() {
  if [ "$1" -ne 0 ]; then
    echo "Error: $2"
    exit 1
  fi
}
