import { create } from 'zustand';

export enum WalletNetwork {
  PUBLIC = 'PUBLIC',
  TESTNET = 'TESTNET',
  FUTURENET = 'FUTURENET',
  STANDALONE = 'STANDALONE'
}

export interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  network: WalletNetwork;
  balance: string;
  userRole: 'admin' | 'donor' | 'beneficiary' | 'none';
  
  // Actions
  connect: (publicKey: string, role?: 'admin' | 'donor' | 'beneficiary') => void;
  disconnect: () => void;
  setNetwork: (network: WalletNetwork) => void;
  setRole: (role: 'admin' | 'donor' | 'beneficiary' | 'none') => void;
  updateBalance: (balance: string) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  publicKey: null,
  isConnected: false,
  network: WalletNetwork.TESTNET,
  balance: '0.00',
  userRole: 'none',

  connect: (publicKey, role = 'donor') => set({
    publicKey,
    isConnected: true,
    userRole: role,
    balance: role === 'admin' ? '12500.50' : role === 'donor' ? '850.25' : '150.00'
  }),
  disconnect: () => set({
    publicKey: null,
    isConnected: false,
    userRole: 'none',
    balance: '0.00'
  }),
  setNetwork: (network) => set({ network }),
  setRole: (userRole) => set({ 
    userRole,
    balance: userRole === 'admin' ? '12500.50' : userRole === 'donor' ? '850.25' : '150.00'
  }),
  updateBalance: (balance) => set({ balance })
}));
