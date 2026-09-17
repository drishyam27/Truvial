import { create } from 'zustand';

export enum WalletNetwork {
  ARBITRUM_SEPOLIA = 'Arbitrum Sepolia (421614)',
  ARBITRUM_ONE = 'Arbitrum One (42161)',
  LOCAL_NITRO = 'Arbitrum Nitro Local (8547)',
  STELLAR_TESTNET = 'Stellar Testnet'
}

export type WalletType = 'metamask' | 'freighter' | 'simulated' | 'none';

export interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  network: WalletNetwork;
  balance: string;
  currency: string;
  walletType: WalletType;
  userRole: 'admin' | 'donor' | 'beneficiary' | 'none';
  
  // Actions
  connect: (
    publicKey: string, 
    role?: 'admin' | 'donor' | 'beneficiary', 
    walletType?: WalletType,
    network?: WalletNetwork,
    currency?: string
  ) => void;
  disconnect: () => void;
  setNetwork: (network: WalletNetwork) => void;
  setRole: (role: 'admin' | 'donor' | 'beneficiary' | 'none') => void;
  updateBalance: (balance: string) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  publicKey: null,
  isConnected: false,
  network: WalletNetwork.ARBITRUM_SEPOLIA,
  balance: '0.00',
  currency: 'USDC',
  walletType: 'none',
  userRole: 'none',

  connect: (publicKey, role = 'donor', walletType = 'simulated', network = WalletNetwork.ARBITRUM_SEPOLIA, currency) => set({
    publicKey,
    isConnected: true,
    userRole: role,
    walletType,
    network,
    currency: currency || (walletType === 'freighter' ? 'XLM' : 'USDC'),
    balance: role === 'admin' ? '12,500.00' : role === 'donor' ? '1,250.00' : '250.00'
  }),
  disconnect: () => set({
    publicKey: null,
    isConnected: false,
    userRole: 'none',
    walletType: 'none',
    balance: '0.00'
  }),
  setNetwork: (network) => set({ network }),
  setRole: (userRole) => set({ 
    userRole,
    balance: userRole === 'admin' ? '12,500.00' : userRole === 'donor' ? '1,250.00' : '250.00'
  }),
  updateBalance: (balance) => set({ balance })
}));


