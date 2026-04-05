import { ethers } from 'ethers';
import * as solc from 'solc';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface CompiledContract {
  abi: any[];
  bytecode: string;
}

function compileSolidity(contractName: string): CompiledContract {
  const contractPath = path.resolve(__dirname, `${contractName}.sol`);
  const source = fs.readFileSync(contractPath, 'utf-8');

  const input = {
    language: 'Solidity',
    sources: { [`${contractName}.sol`]: { content: source } },
    settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter((e: any) => e.severity === 'error');
    if (errors.length > 0) {
      console.error(`\n❌ Compilation errors for ${contractName}:`);
      errors.forEach((err: any) => console.error(err.formattedMessage));
      throw new Error(`Failed to compile ${contractName}`);
    }
  }

  const contract = output.contracts[`${contractName}.sol`][contractName];
  return { abi: contract.abi, bytecode: '0x' + contract.evm.bytecode.object };
}

async function checkContractExists(provider: ethers.JsonRpcProvider, address: string): Promise<boolean> {
  if (!address || address === '') return false;
  try {
    const code = await provider.getCode(address);
    return code !== '0x';
  } catch {
    return false;
  }
}

async function main() {
  const rpcUrl = process.env.EVM_RPC_URL;
  const privateKey = process.env.EVM_PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    console.error('\n❌ ERROR: EVM_RPC_URL and EVM_PRIVATE_KEY must be set in .env\n');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const network = await provider.getNetwork();
  const balance = await provider.getBalance(signer.address);

  console.log('\n┌───────────────────────────────────────────────────┐');
  console.log(`│ Network: ${network.name} (${network.chainId})`.padEnd(52) + '│');
  console.log(`│ Deployer: ${signer.address}`.padEnd(52) + '│');
  console.log(`│ Balance: ${ethers.formatEther(balance)} MATIC`.padEnd(52) + '│');
  console.log('└───────────────────────────────────────────────────┘\n');

  const existingLoan = process.env.EVM_LOAN_REGISTRY_ADDRESS || '';
  const existingContract = process.env.EVM_CONTRACT_REGISTRY_ADDRESS || '';
  const existingPayment = process.env.EVM_PAYMENT_REGISTRY_ADDRESS || '';

  console.log('🔍 Checking existing deployments...\n');

  const loanExists = await checkContractExists(provider, existingLoan);
  const contractExists = await checkContractExists(provider, existingContract);
  const paymentExists = await checkContractExists(provider, existingPayment);

  if (loanExists) console.log(`   ✅ LoanRegistry: ${existingLoan}`);
  if (contractExists) console.log(`   ✅ ContractRegistry: ${existingContract}`);
  if (paymentExists) console.log(`   ✅ PaymentRegistry: ${existingPayment}`);

  if (loanExists && contractExists && paymentExists) {
    console.log('\n🎉 All contracts already deployed!\n');
    return;
  }

  const needsDeploy = !loanExists || !contractExists || !paymentExists;

  if (needsDeploy && balance < ethers.parseEther('0.005')) {
    console.error('❌ Need more test MATIC!\n');
    console.log('Free faucets:');
    console.log('  • https://www.alchemy.com/faucets/polygon-amoy');
    console.log(`\nAddress: ${signer.address}\n`);
    process.exit(1);
  }

  let loanAddr = existingLoan;
  let contractAddr = existingContract;
  let paymentAddr = existingPayment;

  if (!loanExists) {
    console.log('\n⏳ Deploying LoanRegistry...');
    const compiled = compileSolidity('LoanRegistry');
    const factory = new ethers.ContractFactory(compiled.abi, compiled.bytecode, signer);
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    loanAddr = await contract.getAddress();
    console.log(`   ✅ ${loanAddr}`);
  }

  if (!contractExists) {
    console.log('\n⏳ Deploying ContractRegistry...');
    const compiled = compileSolidity('ContractRegistry');
    const factory = new ethers.ContractFactory(compiled.abi, compiled.bytecode, signer);
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    contractAddr = await contract.getAddress();
    console.log(`   ✅ ${contractAddr}`);
  }

  if (!paymentExists) {
    console.log('\n⏳ Deploying PaymentRegistry...');
    const compiled = compileSolidity('PaymentRegistry');
    const factory = new ethers.ContractFactory(compiled.abi, compiled.bytecode, signer);
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    paymentAddr = await contract.getAddress();
    console.log(`   ✅ ${paymentAddr}`);
  }

  if (needsDeploy) {
    console.log('\n✅ Deployment complete!\n');
    const envPath = path.resolve(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    envContent = envContent
      .replace(/EVM_LOAN_REGISTRY_ADDRESS=.*/, `EVM_LOAN_REGISTRY_ADDRESS=${loanAddr}`)
      .replace(/EVM_CONTRACT_REGISTRY_ADDRESS=.*/, `EVM_CONTRACT_REGISTRY_ADDRESS=${contractAddr}`)
      .replace(/EVM_PAYMENT_REGISTRY_ADDRESS=.*/, `EVM_PAYMENT_REGISTRY_ADDRESS=${paymentAddr}`);
    fs.writeFileSync(envPath, envContent);
    console.log('.env updated!\n');
  }
}

main().catch(console.error);
