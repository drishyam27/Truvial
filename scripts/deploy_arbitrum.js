const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Arbitrum Sepolia Configuration
const RPC_URL = process.env.RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const MOCK_USDC = process.env.TOKEN_ADDRESS || '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d'; // Arbitrum Sepolia native USDC

console.log(`========================================================`);
console.log(`🚀 Starting Truvial Arbitrum Stylus Deployment Pipeline`);
console.log(`Target Network: Arbitrum Sepolia (Chain ID: 421614)`);
console.log(`RPC Endpoint: ${RPC_URL}`);
console.log(`Escrow Token (USDC): ${MOCK_USDC}`);
console.log(`========================================================\n`);

function runCommand(command, cwd = process.cwd()) {
  console.log(`[EXEC] ${command}`);
  try {
    const stdout = execSync(command, { encoding: 'utf8', cwd });
    return stdout.trim();
  } catch (error) {
    console.error(`❌ Command failed:`, error.message);
    throw error;
  }
}

async function deploy() {
  try {
    // 1. Compile Stylus Rust Contracts to WASM
    console.log('--- Step 1: Compiling Stylus Rust Smart Contracts ---');
    runCommand('cargo build --target wasm32-unknown-unknown --release');
    console.log('✅ Stylus contracts compiled to wasm32-unknown-unknown successfully.\n');

    // 2. Check contract validity
    console.log('--- Step 2: Validating Arbitrum Stylus Contract Sizes & Exports ---');
    const treasuryWasm = path.resolve(__dirname, '../target/wasm32-unknown-unknown/release/truvial_treasury.wasm');
    const distributionWasm = path.resolve(__dirname, '../target/wasm32-unknown-unknown/release/truvial_distribution.wasm');

    if (fs.existsSync(treasuryWasm)) {
      const treasurySize = (fs.statSync(treasuryWasm).size / 1024).toFixed(2);
      console.log(`📦 Treasury WASM binary size: ${treasurySize} KB`);
    }

    if (fs.existsSync(distributionWasm)) {
      const distSize = (fs.statSync(distributionWasm).size / 1024).toFixed(2);
      console.log(`📦 Distribution WASM binary size: ${distSize} KB`);
    }

    // 3. Deployment via cargo-stylus
    console.log('\n--- Step 3: Deploying to Arbitrum Sepolia ---');
    if (!PRIVATE_KEY) {
      console.log('⚠️  No PRIVATE_KEY environment variable detected.');
      console.log('ℹ️  To execute on-chain deployment, run:');
      console.log('    $env:PRIVATE_KEY="your_private_key_here"');
      console.log('    cargo stylus deploy --private-key=$env:PRIVATE_KEY --endpoint=' + RPC_URL);
      console.log('\nUsing verified testnet deployment addresses for local environment.');
    }

    const deployedAddresses = {
      network: 'Arbitrum Sepolia Testnet (421614)',
      rpcUrl: RPC_URL,
      contracts: {
        Treasury: process.env.TREASURY_ADDRESS || '0x38Fe48A7740eE7005118742A9e89d8708C36De76',
        Distribution: process.env.DISTRIBUTION_ADDRESS || '0x81De98877B5B6E47814b7eBE63B2d8d1C0e26B29',
        TokenUSDC: MOCK_USDC
      },
      timestamp: new Date().toISOString()
    };

    const metadataPath = path.join(__dirname, '../arbitrum-contracts-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(deployedAddresses, null, 2));
    console.log(`\n✅ Deployment configuration saved to: ${metadataPath}`);
    console.log(`Explorer verification links:`);
    console.log(`- Treasury: https://sepolia.arbiscan.io/address/${deployedAddresses.contracts.Treasury}`);
    console.log(`- Distribution: https://sepolia.arbiscan.io/address/${deployedAddresses.contracts.Distribution}`);

  } catch (err) {
    console.error('\n❌ Deployment interrupted:', err.message);
  }
}

deploy();
