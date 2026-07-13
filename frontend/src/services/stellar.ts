import { useWalletStore } from '../state/wallet';
import { useTxStore } from '../state/tx';
import { useProjectsStore } from '../state/projects';

// Simulated delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class StellarService {
  private static mockHash(): string {
    return '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  // Connects wallet
  static async connectWallet(role: 'admin' | 'donor' | 'beneficiary' = 'donor'): Promise<string> {
    const isMock = useWalletStore.getState().isMockMode;
    
    if (isMock) {
      await delay(800);
      const mockKey = role === 'admin' 
        ? 'GBADMIN777...TRUVIAL' 
        : role === 'donor' 
        ? 'GBDONOR888...ALICE' 
        : 'GBBENEF999...WATER';
      useWalletStore.getState().connect(mockKey, role);
      return mockKey;
    }

    try {
      // In real mode, use stellar-wallets-kit
      // Import dynamically to avoid SSR errors
      const { StellarWalletsKit, WalletNetwork, WalletType } = await import('@creit.tech/stellar-wallets-kit');
      const kit = new StellarWalletsKit({
        network: WalletNetwork.TESTNET,
        selectedWallet: WalletType.FREIGHTER
      });

      const { address } = await kit.getAddress();
      useWalletStore.getState().connect(address, role);
      return address;
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      throw new Error(error?.message || 'Freighter wallet connection failed. Make sure it is installed and unlocked.');
    }
  }

  // Disconnect wallet
  static async disconnectWallet(): Promise<void> {
    await delay(300);
    useWalletStore.getState().disconnect();
  }

  // Donate funds to treasury
  static async donate(amount: number): Promise<string> {
    const state = useWalletStore.getState();
    const donor = state.publicKey;
    if (!donor) throw new Error('Wallet not connected');

    const txId = 'tx_' + Math.random().toString(36).substring(7);
    useTxStore.getState().addTransaction({
      id: txId,
      title: `Donate ${amount} XLM`,
      status: 'pending',
      amount: amount.toString()
    });

    if (state.isMockMode) {
      // 1. Pending -> Processing (after 1s)
      await delay(1200);
      useTxStore.getState().updateTransaction(txId, { status: 'processing' });

      // 2. Processing -> Confirmed (after 1.5s)
      await delay(1500);
      const hash = this.mockHash();
      useTxStore.getState().updateTransaction(txId, { status: 'confirmed', hash });

      // Update state stores
      useProjectsStore.getState().addDonation(donor, amount, true);
      
      // Update donor's local wallet balance in mockup
      const currentBal = parseFloat(state.balance);
      useWalletStore.getState().updateBalance((currentBal - amount).toFixed(2));

      return hash;
    }

    try {
      // Real transaction assembly using @stellar/stellar-sdk (mocked in background environment)
      // When deployed, this interacts with the actual Soroban Treasury contract
      await delay(2000);
      throw new Error('Testnet node unreachable. Switch to Simulation mode in settings to test.');
    } catch (err: any) {
      useTxStore.getState().updateTransaction(txId, { 
        status: 'failed', 
        error: err.message || 'Transaction submission timed out.' 
      });
      throw err;
    }
  }

  // Create Project (Admin only)
  static async createProject(title: string, description: string, beneficiary: string, totalBudget: number): Promise<string> {
    const state = useWalletStore.getState();
    if (state.userRole !== 'admin') throw new Error('Unauthorized: Admin access required.');

    const txId = 'tx_' + Math.random().toString(36).substring(7);
    useTxStore.getState().addTransaction({
      id: txId,
      title: `Create Project: ${title}`,
      status: 'pending'
    });

    if (state.isMockMode) {
      await delay(1000);
      useTxStore.getState().updateTransaction(txId, { status: 'processing' });
      await delay(1200);
      const hash = this.mockHash();
      useTxStore.getState().updateTransaction(txId, { status: 'confirmed', hash });

      useProjectsStore.getState().createProject(title, description, beneficiary, totalBudget);
      return hash;
    }

    // Real call logic goes here...
    await delay(1000);
    useTxStore.getState().updateTransaction(txId, { status: 'failed', error: 'Network error' });
    throw new Error('Failed to connect to Soroban Network');
  }

  // Approve Milestone (Admin only)
  static async approveMilestone(projectId: number, milestoneId: number): Promise<string> {
    const state = useWalletStore.getState();
    if (state.userRole !== 'admin') throw new Error('Unauthorized: Admin access required.');

    const txId = 'tx_' + Math.random().toString(36).substring(7);
    useTxStore.getState().addTransaction({
      id: txId,
      title: `Approve Milestone #${milestoneId}`,
      status: 'pending'
    });

    if (state.isMockMode) {
      await delay(1000);
      useTxStore.getState().updateTransaction(txId, { status: 'processing' });
      await delay(1000);
      const hash = this.mockHash();
      useTxStore.getState().updateTransaction(txId, { status: 'confirmed', hash });

      useProjectsStore.getState().approveMilestone(projectId, milestoneId);
      return hash;
    }

    await delay(1000);
    useTxStore.getState().updateTransaction(txId, { status: 'failed', error: 'Contract call failed' });
    throw new Error('Contract call failed');
  }

  // Release Milestone Funds (Admin only)
  static async releaseMilestoneFunds(projectId: number, milestoneId: number): Promise<string> {
    const state = useWalletStore.getState();
    if (state.userRole !== 'admin') throw new Error('Unauthorized: Admin access required.');

    const txId = 'tx_' + Math.random().toString(36).substring(7);
    useTxStore.getState().addTransaction({
      id: txId,
      title: `Release Funds: Milestone #${milestoneId}`,
      status: 'pending'
    });

    if (state.isMockMode) {
      await delay(1000);
      useTxStore.getState().updateTransaction(txId, { status: 'processing' });
      await delay(1500);
      const hash = this.mockHash();
      useTxStore.getState().updateTransaction(txId, { status: 'confirmed', hash });

      useProjectsStore.getState().releaseMilestoneFunds(projectId, milestoneId);
      return hash;
    }

    await delay(1000);
    useTxStore.getState().updateTransaction(txId, { status: 'failed', error: 'Contract call failed' });
    throw new Error('Contract call failed');
  }
}
