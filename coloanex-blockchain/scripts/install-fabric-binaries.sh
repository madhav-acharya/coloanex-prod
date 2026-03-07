#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DIR="${SCRIPT_DIR}/../bin"
CONFIG_DIR="${SCRIPT_DIR}/../config"

FABRIC_VERSION="2.5.9"
CA_VERSION="1.5.12"

ARCH="$(uname -m)"
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"

if [ "${ARCH}" = "arm64" ] || [ "${ARCH}" = "aarch64" ]; then
  FABRIC_ARCH="arm64"
else
  FABRIC_ARCH="amd64"
fi

FABRIC_URL="https://github.com/hyperledger/fabric/releases/download/v${FABRIC_VERSION}/hyperledger-fabric-${OS}-${FABRIC_ARCH}-${FABRIC_VERSION}.tar.gz"
CA_URL="https://github.com/hyperledger/fabric-ca/releases/download/v${CA_VERSION}/hyperledger-fabric-ca-${OS}-${FABRIC_ARCH}-${CA_VERSION}.tar.gz"

mkdir -p "${BIN_DIR}" "${CONFIG_DIR}"

echo "Detected: OS=${OS}, ARCH=${FABRIC_ARCH}"
echo "Downloading Fabric ${FABRIC_VERSION} binaries..."
curl -fsSL "${FABRIC_URL}" | tar -xz -C "${SCRIPT_DIR}/.."

echo "Downloading Fabric CA ${CA_VERSION} binaries..."
curl -fsSL "${CA_URL}" | tar -xz -C "${SCRIPT_DIR}/.."

echo "Making binaries executable..."
chmod +x "${BIN_DIR}"/*

echo ""
echo "Installed binaries:"
ls "${BIN_DIR}"

echo ""
echo "Add to your PATH:"
echo "  export PATH=\"${BIN_DIR}:\$PATH\""
