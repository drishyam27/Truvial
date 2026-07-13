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
    try {
      // In real mode, use stellar-wallets-kit
      // Import dynamically to avoid SSR errors
      const { 
        StellarWalletsKit, 
        WalletNetwork,
        FreighterModule,
        xBullModule,
        AlbedoModule,
        RabetModule,
        LobstrModule,
        HanaModule
      } = await import('@creit.tech/stellar-wallets-kit');

      const kit = new StellarWalletsKit({
        network: WalletNetwork.TESTNET,
        modules: [
          new FreighterModule(),
          new xBullModule(),
          new AlbedoModule(),
          new RabetModule(),
          new LobstrModule(),
          new HanaModule()
        ]
      });

      return new Promise<string>((resolve, reject) => {
        kit.openModal({
          modalTitle: 'Connect Wallet',
          onWalletSelected: async (option) => {
            try {
              kit.setWallet(option.id);
              const { address } = await kit.getAddress();
              useWalletStore.getState().connect(address, role);
              resolve(address);
            } catch (err: any) {
              reject(err);
            }
          },
          onClosed: () => {
            reject(new Error('Connection closed by user'));
          }
        });
      });
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      throw new Error(error?.message || 'Wallet connection failed. Make sure your extension is unlocked.');
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

    // 1. Pending -> Processing (after 1.2s)
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

    await delay(1000);
    useTxStore.getState().updateTransaction(txId, { status: 'processing' });
    await delay(1200);
    const hash = this.mockHash();
    useTxStore.getState().updateTransaction(txId, { status: 'confirmed', hash });

    useProjectsStore.getState().createProject(title, description, beneficiary, totalBudget);
    return hash;
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

    await delay(1000);
    useTxStore.getState().updateTransaction(txId, { status: 'processing' });
    await delay(1000);
    const hash = this.mockHash();
    useTxStore.getState().updateTransaction(txId, { status: 'confirmed', hash });

    useProjectsStore.getState().approveMilestone(projectId, milestoneId);
    return hash;
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

    await delay(1000);
    useTxStore.getState().updateTransaction(txId, { status: 'processing' });
    await delay(1500);
    const hash = this.mockHash();
    useTxStore.getState().updateTransaction(txId, { status: 'confirmed', hash });

    useProjectsStore.getState().releaseMilestoneFunds(projectId, milestoneId);
    return hash;
  }
}
