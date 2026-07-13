const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Target Network (default is testnet)
const NETWORK = process.env.STELLAR_NETWORK || 'testnet';
const SOURCE_ACCOUNT = process.env.STELLAR_SOURCE || 'alice';

console.log(`Starting deployment script for Truvial...`);
console.log(`Target Network: ${NETWORK}`);
console.log(`Source Account: ${SOURCE_ACCOUNT}\n`);

function runCommand(command) {
  console.log(`Executing: ${command}`);
  try {
    const stdout = execSync(command, { encoding: 'utf8' });
    return stdout.trim();
  } catch (error) {
    console.error(`Command execution failed:`, error.message);
    throw error;
  }
}

async function deploy() {
  try {
    // 1. Build WASM binaries
    console.log('--- Step 1: Compiling Soroban Contracts ---');
    runCommand('cargo build --target wasm32-unknown-unknown --release');
    console.log('Contracts compiled successfully.\n');

    // Paths to built WASM
    const treasuryWasm = 'target/wasm32-unknown-unknown/release/truvial_treasury.wasm';
    const distributionWasm = 'target/wasm32-unknown-unknown/release/truvial_distribution.wasm';

    // 2. Deploy Treasury WASM
    console.log('--- Step 2: Deploying Treasury Contract ---');
    const deployTreasuryCmd = `stellar contract deploy --wasm ${treasuryWasm} --source ${SOURCE_ACCOUNT} --network ${NETWORK}`;
    const treasuryId = runCommand(deployTreasuryCmd);
    console.log(`Treasury Contract ID: ${treasuryId}\n`);

    // 3. Deploy Distribution WASM
    console.log('--- Step 3: Deploying Distribution Contract ---');
    const deployDistCmd = `stellar contract deploy --wasm ${distributionWasm} --source ${SOURCE_ACCOUNT} --network ${NETWORK}`;
    const distributionId = runCommand(deployDistCmd);
    console.log(`Distribution Contract ID: ${distributionId}\n`);

    // 4. Resolve mock/native token (In Testnet, native XLM contract is CDLZFC3SYJYDZT7KBAVPPN3OSPGL63B676ER7G7JPHCSCC57IOKRLZAI)
    const tokenAddress = NETWORK === 'testnet' 
      ? 'CDLZFC3SYJYDZT7KBAVPPN3OSPGL63B676ER7G7JPHCSCC57IOKRLZAI' 
      : 'CDMOCKSACADDRESS777KEY'; // Local sandbox mock

    // 5. Get source wallet address
    console.log('--- Step 4: Resolving Admin Address ---');
    const getAddressCmd = `stellar keys address ${SOURCE_ACCOUNT}`;
    const adminAddress = runCommand(getAddressCmd);
    console.log(`Admin Address: ${adminAddress}\n`);

    // 6. Initialize Treasury
    console.log('--- Step 5: Initializing Treasury Contract ---');
    const initTreasuryCmd = `stellar contract invoke --id ${treasuryId} --source ${SOURCE_ACCOUNT} --network ${NETWORK} -- initialize --admin ${adminAddress} --distribution_contract ${distributionId} --token ${tokenAddress}`;
    const initTreasuryTx = runCommand(initTreasuryCmd);
    console.log(`Treasury initialized. Tx hash output: ${initTreasuryTx}\n`);

    // 7. Initialize Distribution
    console.log('--- Step 6: Initializing Distribution Contract ---');
    const initDistCmd = `stellar contract invoke --id ${distributionId} --source ${SOURCE_ACCOUNT} --network ${NETWORK} -- initialize --admin ${adminAddress} --treasury ${treasuryId}`;
    const initDistTx = runCommand(initDistCmd);
    console.log(`Distribution initialized. Tx hash output: ${initDistTx}\n`);

    // 8. Store Metadata
    const metadata = {
      network: NETWORK,
      adminAddress,
      tokenAddress,
      treasuryId,
      distributionId,
      timestamp: new Date().toISOString(),
      transactions: {
        initTreasury: initTreasuryTx,
        initDistribution: initDistTx
      }
    };

    const metadataPath = path.join(__dirname, '../contracts-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`--- Deployment Completed successfully! ---`);
    console.log(`Metadata saved to: ${metadataPath}`);

  } catch (err) {
    console.error('\nDeployment aborted due to errors.');
    console.log('Note: To run deployments locally, ensure you have the Stellar CLI installed, a wallet configured as "alice", and access to the network node.');
  }
}

deploy();
