import { Injectable, Logger } from '@nestjs/common';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SolanaService {
  private readonly logger = new Logger(SolanaService.name);
  private connection: Connection;
  private wallet: Wallet;
  private provider: AnchorProvider;
  private program: Program | null = null;

  constructor() {
    this.connection = new Connection(
      process.env.SOLANA_NETWORK || 'http://localhost:8899',
      'confirmed',
    );

    try {
      const walletPath =
        process.env.SOLANA_WALLET_PATH ||
        `${process.env.HOME}/.config/solana/id.json`;
      const keypairData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
      const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
      this.wallet = new Wallet(keypair);
      this.provider = new AnchorProvider(this.connection, this.wallet, {
        commitment: 'confirmed',
      });

      const idlPath =
        process.env.SOLANA_IDL_PATH ||
        path.resolve(
          __dirname,
          '../../../../coloanex-solana/target/idl/loan_program.json',
        );

      const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
      this.program = new Program(idl, this.provider);
      this.logger.log(
        `Solana program initialized: ${this.program.programId.toBase58()}`,
      );
    } catch (error) {
      this.logger.warn(
        'Solana program could not be initialized — blockchain calls will be skipped',
        (error as Error).message,
      );
    }
  }

  getWalletPublicKey(): string | null {
    return this.wallet ? this.wallet.publicKey.toBase58() : null;
  }

  async createLoan(
    loanId: string,
    amount: number,
    interestRate: number,
    termMonths: number,
    borrowerPubkey: string,
    lenderPubkey: string,
  ) {
    try {
      if (!this.program) {
        this.logger.warn('Solana program not initialized — skipping createLoan');
        return null;
      }

      const borrower = new PublicKey(borrowerPubkey);
      const lender = new PublicKey(lenderPubkey);

      const [loanPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('loan'), Buffer.from(loanId)],
        this.program.programId,
      );

      const tx = await this.program.methods
        .createLoan(
          loanId,
          new BN(Math.round(amount * 100)),
          interestRate,
          termMonths,
        )
        .accounts({
          loan: loanPda,
          borrower: borrower,
          lender: lender,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      this.logger.log(
        `[createLoan] loan=${loanId} tx=${tx} pda=${loanPda.toBase58()}`,
      );
      return { txId: tx, pda: loanPda.toBase58() };
    } catch (error) {
      this.logger.error('Failed to create loan on Solana', (error as Error).message);
      return null;
    }
  }

  async updateLoanStatus(loanId: string, status: string) {
    try {
      if (!this.program) {
        this.logger.warn(
          'Solana program not initialized — skipping updateLoanStatus',
        );
        return null;
      }

      const authority = this.wallet.publicKey;
      const [loanPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('loan'), Buffer.from(loanId)],
        this.program.programId,
      );

      const statusEnum = this.mapLoanStatus(status);
      const tx = await this.program.methods
        .updateLoanStatus(loanId, statusEnum)
        .accounts({
          loan: loanPda,
          authority: authority,
        })
        .rpc();

      this.logger.log(`[updateLoanStatus] loan=${loanId} status=${status} tx=${tx}`);
      return { txId: tx };
    } catch (error) {
      this.logger.error('Failed to update loan status on Solana', (error as Error).message);
      return null;
    }
  }

  async createContract(
    contractId: string,
    loanId: string,
    contractNumber: string,
    loanAmount: number,
    interestRate: number,
    termMonths: number,
    totalAmountDue: number,
  ) {
    try {
      if (!this.program) {
        this.logger.warn(
          'Solana program not initialized — skipping createContract',
        );
        return null;
      }

      const lender = this.wallet.publicKey;
      const [contractPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('contract'), Buffer.from(contractId)],
        this.program.programId,
      );
      const [loanPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('loan'), Buffer.from(loanId)],
        this.program.programId,
      );

      const tx = await this.program.methods
        .createContract(
          contractId,
          loanId,
          contractNumber,
          new BN(Math.round(loanAmount * 100)),
          Math.round(interestRate * 100),
          termMonths,
          new BN(Math.round(totalAmountDue * 100)),
        )
        .accounts({
          contract: contractPda,
          loan: loanPda,
          lender: lender,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      this.logger.log(
        `[createContract] contract=${contractId} tx=${tx} pda=${contractPda.toBase58()}`,
      );
      return { txId: tx, pda: contractPda.toBase58() };
    } catch (error) {
      this.logger.error('Failed to create contract on Solana', (error as Error).message);
      return null;
    }
  }

  async signContract(contractId: string) {
    try {
      if (!this.program) {
        this.logger.warn(
          'Solana program not initialized — skipping signContract',
        );
        return null;
      }

      const signer = this.wallet.publicKey;
      const [contractPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('contract'), Buffer.from(contractId)],
        this.program.programId,
      );

      const tx = await this.program.methods
        .signContract(contractId)
        .accounts({
          contract: contractPda,
          signer: signer,
        })
        .rpc();

      this.logger.log(`[signContract] contract=${contractId} tx=${tx}`);
      return { txId: tx };
    } catch (error) {
      this.logger.error('Failed to sign contract on Solana', (error as Error).message);
      return null;
    }
  }

  async recordPayment(
    paymentId: string,
    contractId: string,
    amount: number,
    paymentMethod: string,
    transactionRef: string,
  ) {
    try {
      if (!this.program) {
        this.logger.warn(
          'Solana program not initialized — skipping recordPayment',
        );
        return null;
      }

      const payer = this.wallet.publicKey;
      const [paymentPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('payment'), Buffer.from(paymentId)],
        this.program.programId,
      );
      const [contractPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('contract'), Buffer.from(contractId)],
        this.program.programId,
      );

      const tx = await this.program.methods
        .recordPayment(
          paymentId,
          contractId,
          new BN(Math.round(amount * 100)),
          paymentMethod,
          transactionRef,
        )
        .accounts({
          payment: paymentPda,
          contract: contractPda,
          payer: payer,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      this.logger.log(
        `[recordPayment] payment=${paymentId} contract=${contractId} tx=${tx} pda=${paymentPda.toBase58()}`,
      );
      return { txId: tx, pda: paymentPda.toBase58() };
    } catch (error) {
      this.logger.error('Failed to record payment on Solana', (error as Error).message);
      return null;
    }
  }

  private mapLoanStatus(status: string): any {
    const statusMap: Record<string, any> = {
      DRAFT: { draft: {} },
      SUBMITTED: { submitted: {} },
      UNDER_REVIEW: { underReview: {} },
      APPROVED: { approved: {} },
      CONTRACT_GENERATED: { contractGenerated: {} },
      CONTRACT_SIGNED: { contractSigned: {} },
      LOAN_PROVIDED: { disbursed: {} },
      ACTIVE: { active: {} },
      COMPLETED: { completed: {} },
      REJECTED: { rejected: {} },
      DEFAULTED: { defaulted: {} },
    };
    return statusMap[status] || { draft: {} };
  }
}
