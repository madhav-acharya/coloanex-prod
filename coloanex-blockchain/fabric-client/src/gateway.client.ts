import * as grpc from "@grpc/grpc-js";
import {
  connect,
  Contract,
  Gateway,
  hash,
  Identity,
  Signer,
  signers,
} from "@hyperledger/fabric-gateway";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { FabricConnectionProfile, TransactionResult } from "./types";

export class FabricGatewayClient {
  private gateway: Gateway | null = null;
  private client: grpc.Client | null = null;
  private contract: Contract | null = null;
  private readonly profile: FabricConnectionProfile;

  constructor(profile: FabricConnectionProfile) {
    this.profile = profile;
  }

  async connect(): Promise<void> {
    this.client = await this.buildGrpcConnection();
    const identity = await this.buildIdentity();
    const signer = await this.buildSigner();

    this.gateway = connect({
      client: this.client,
      identity,
      signer,
      hash: hash.sha256,
    });

    const network = this.gateway.getNetwork(this.profile.channelName);
    this.contract = network.getContract(this.profile.chaincodeName);
  }

  async disconnect(): Promise<void> {
    this.gateway?.close();
    this.client?.close();
    this.gateway = null;
    this.client = null;
    this.contract = null;
  }

  async submitTransaction(
    fnName: string,
    ...args: string[]
  ): Promise<TransactionResult> {
    this.ensureConnected();
    const transaction = await this.contract!.submitAsync(fnName, {
      arguments: args,
    });
    await transaction.getStatus();
    const txId = transaction.getTransactionId();
    const result = transaction.getResult();
    return {
      success: true,
      data:
        result.length > 0 ? JSON.parse(Buffer.from(result).toString()) : null,
      txId,
    };
  }

  async evaluateTransaction(
    fnName: string,
    ...args: string[]
  ): Promise<unknown> {
    this.ensureConnected();
    const result = await this.contract!.evaluateTransaction(fnName, ...args);
    return result.length > 0
      ? JSON.parse(Buffer.from(result).toString())
      : null;
  }

  private ensureConnected(): void {
    if (!this.contract) {
      throw new Error(
        "FabricGatewayClient is not connected. Call connect() first.",
      );
    }
  }

  private async buildGrpcConnection(): Promise<grpc.Client> {
    const tlsRootCert = fs.readFileSync(this.profile.tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);

    return new grpc.Client(this.profile.peerEndpoint, tlsCredentials, {
      "grpc.ssl_target_name_override": this.profile.peerHostAlias,
    });
  }

  private async buildIdentity(): Promise<Identity> {
    const certPem = fs.readFileSync(this.profile.certPath).toString();
    return {
      mspId: this.profile.mspId,
      credentials: Buffer.from(certPem),
    };
  }

  private async buildSigner(): Promise<Signer> {
    const keyFiles = fs.readdirSync(this.profile.keyDirectoryPath);
    if (keyFiles.length === 0) {
      throw new Error(
        `No private key found in ${this.profile.keyDirectoryPath}`,
      );
    }
    const keyPem = fs
      .readFileSync(path.join(this.profile.keyDirectoryPath, keyFiles[0]))
      .toString();
    const privateKey = crypto.createPrivateKey(keyPem);
    return signers.newPrivateKeySigner(privateKey);
  }
}
