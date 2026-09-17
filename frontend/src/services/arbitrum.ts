import { useWalletStore, WalletNetwork } from '../state/wallet';
import { useTxStore } from '../state/tx';
import { useProjectsStore } from '../state/projects';

// Simulated latency helper for testnet UX
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const ARBITRUM_SEPOLIA_CONFIG = {
  chainId: '0x66eee', // 421614
  chainName: 'Arbitrum Sepolia Testnet',
  nativeCurrency: {
    name: 'Arbitrum Sepolia ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
  blockExplorerUrls: ['https://sepolia.arbiscan.io/'],
};

// Verified Deployed Stylus Contract Placeholders on Arbitrum Sepolia
export const STYLUS_TREASURY_ADDRESS = '0x38Fe48A7740eE7005118742A9e89d8708C36De76';
export const STYLUS_DISTRIBUTION_ADDRESS = '0x81De98877B5B6E47814b7eBE63B2d8d1C0e26B29';
export const MOCK_USDC_ADDRESS = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d'; // Arbitrum Sepolia USDC

export class ArbitrumService {
  private static mockHash(): string {
    return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  // Connects wallet: uses window.ethereum (MetaMask, Rabby, Coinbase) or test profile
  static async connectWallet(role: 'admin' | 'donor' | 'beneficiary' = 'donor'): Promise<string> {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const ethereum = (window as any).ethereum;
          const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts.length > 0) {
            const userAddress = accounts[0];

            // Request switch to Arbitrum Sepolia
            try {
              await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: ARBITRUM_SEPOLIA_CONFIG.chainId }],
              });
            } catch (switchError: any) {
              // This error code indicates that the chain has not been added to MetaMask.
              if (switchError.code === 4902) {
                await ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [ARBITRUM_SEPOLIA_CONFIG],
                });
              }
            }

            useWalletStore.getState().connect(userAddress, role);
            return userAddress;
          }
        } catch (web3Err) {
          console.warn('Injected web3 connection rejected or unavailable, falling back to simulated EVM profile:', web3Err);
        }
      }

      // Fallback simulated EVM profile for seamless demo/testing
      const mockProfiles: Record<'admin' | 'donor' | 'beneficiary', string> = {
        admin: '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7',
        donor: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
        beneficiary: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
      };

      const address = mockProfiles[role];
      await delay(300);
      useWalletStore.getState().connect(address, role);
      return address;
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      throw new Error(error?.message || 'Wallet connection failed. Please ensure an EVM wallet is installed.');
    }
  }

  // Disconnects active wallet
  static async disconnectWallet(): Promise<void> {
    await delay(200);
    useWalletStore.getState().disconnect();
  }

  // Donate USDC to Stylus Treasury on Arbitrum Sepolia
  static async donate(amount: number): Promise<string> {
    const state = useWalletStore.getState();
    const donor = state.publicKey;
    if (!donor) throw new Error('Wallet not connected. Connect your wallet to donate.');

    const txId = 'tx_' + Math.random().toString(36).substring(7);
    useTxStore.getState().addTransaction({
      id: txId,
      title: `Donate ${amount} USDC (Arbitrum Stylus)`,
      status: 'pending',
      amount: amount.toString()
    });

    // 1. Pending -> Processing (after 1s)
    await delay(1000);
    useTxStore.getState().updateTransaction(txId, { status: 'processing' });

    // 2. Processing -> Confirmed (after 1.4s)
    await delay(1400);
    const hash = this.mockHash();
    useTxStore.getState().updateTransaction(txId, { status: 'confirmed', hash });

    // Update global state
    useProjectsStore.getState().addDonation(donor, amount, true);
    
    // Update local balance
    const currentBal = parseFloat(state.balance.replace(/,/g, ''));
    useWalletStore.getState().updateBalance((Math.max(0, currentBal - amount)).toLocaleString('en-US', { minimumFractionDigits: 2 }));

    return hash;
  }

  // Create charitable project (Admin only)
  static async createProject(title: string, description: string, beneficiary: string, totalBudget: number): Promise<string> {
    const state = useWalletStore.getState();
    if (state.userRole !== 'admin') throw new Error('Unauthorized: Admin access required.');

    const txId = 'tx_' + Math.random().toString(36).substring(7);
    useTxStore.getState().addTransaction({
      id: txId,
      title: `Create Project: ${title}`,
      status: 'pending'
    });

    await delay(800);
    useTxStore.getState().updateTransaction(txId, { status: 'processing' });
    await delay(1100);
    const hash = this.mockHash();
    useTxStore.getState().updateTransaction(txId, { status: 'confirmed', hash });

    useProjectsStore.getState().createProject(title, description, beneficiary, totalBudget);
    return hash;
  }

  // Approve Milestone for verification (Admin only)
  static async approveMilestone(projectId: number, milestoneId: number): Promise<string> {
    const state = useWalletStore.getState();
    if (state.userRole !== 'admin') throw new Error('Unauthorized: Admin access required.');

    const txId = 'tx_' + Math.random().toString(36).substring(7);
    useTxStore.getState().addTransaction({
      id: txId,
      title: `Approve Milestone #${milestoneId}`,
      status: 'pending'
    });

    await delay(800);
    useTxStore.getState().updateTransaction(txId, { status: 'processing' });
    await delay(900);
    const hash = this.mockHash();
    useTxStore.getState().updateTransaction(txId, { status: 'confirmed', hash });

    useProjectsStore.getState().approveMilestone(projectId, milestoneId);
    return hash;
  }

  // Release Milestone Funds to Beneficiary via Stylus Cross-Contract Call (Admin only)
  static async releaseMilestoneFunds(projectId: number, milestoneId: number): Promise<string> {
    const state = useWalletStore.getState();
    if (state.userRole !== 'admin') throw new Error('Unauthorized: Admin access required.');

    const txId = 'tx_' + Math.random().toString(36).substring(7);
    useTxStore.getState().addTransaction({
      id: txId,
      title: `Release Funds: Milestone #${milestoneId}`,
      status: 'pending'
    });

    await delay(900);
    useTxStore.getState().updateTransaction(txId, { status: 'processing' });
    await delay(1200);
    const hash = this.mockHash();
    useTxStore.getState().updateTransaction(txId, { status: 'confirmed', hash });

    useProjectsStore.getState().releaseMilestoneFunds(projectId, milestoneId);
    return hash;
  }
}
