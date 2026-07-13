import { create } from 'zustand';

export interface Transaction {
  id: string;
  title: string;
  hash: string | null;
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  timestamp: number;
  error?: string;
  amount?: string;
}

interface TxState {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'timestamp' | 'hash'>) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id'>>) => void;
  clearTransactions: () => void;
}

export const useTxStore = create<TxState>((set) => ({
  transactions: [],
  addTransaction: (tx) => set((state) => ({
    transactions: [
      {
        ...tx,
        hash: null,
        timestamp: Date.now()
      },
      ...state.transactions
    ]
  })),
  updateTransaction: (id, updates) => set((state) => ({
    transactions: state.transactions.map((tx) =>
      tx.id === id ? { ...tx, ...updates } : tx
    )
  })),
  clearTransactions: () => set({ transactions: [] })
}));
