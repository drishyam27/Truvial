import { describe, it, expect, beforeEach } from 'vitest';
import { useWalletStore, WalletNetwork } from '../state/wallet';

describe('useWalletStore unit tests', () => {
  beforeEach(() => {
    // Reset state before each test
    useWalletStore.setState({
      publicKey: null,
      isConnected: false,
      network: WalletNetwork.ARBITRUM_SEPOLIA,
      balance: '0.00',
      currency: 'USDC',
      userRole: 'none'
    });
  });

  it('should initialize with correct default values', () => {
    const state = useWalletStore.getState();
    expect(state.isConnected).toBe(false);
    expect(state.publicKey).toBeNull();
    expect(state.userRole).toBe('none');
    expect(state.balance).toBe('0.00');
    expect(state.currency).toBe('USDC');
    expect(state.network).toBe(WalletNetwork.ARBITRUM_SEPOLIA);
  });

  it('should connect user successfully and set role-specific mock balances', () => {
    const mockAddress = '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7';
    
    // Connect as admin
    useWalletStore.getState().connect(mockAddress, 'admin');
    let state = useWalletStore.getState();
    expect(state.isConnected).toBe(true);
    expect(state.publicKey).toBe(mockAddress);
    expect(state.userRole).toBe('admin');
    expect(state.balance).toBe('12,500.00');

    // Connect as donor
    useWalletStore.getState().connect(mockAddress, 'donor');
    state = useWalletStore.getState();
    expect(state.userRole).toBe('donor');
    expect(state.balance).toBe('1,250.00');
  });

  it('should disconnect and clear all states', () => {
    const mockAddress = '0x2546BcD3c84621e976D8185a91A922aE77ECEc30';
    useWalletStore.getState().connect(mockAddress, 'donor');
    
    useWalletStore.getState().disconnect();
    const state = useWalletStore.getState();
    expect(state.isConnected).toBe(false);
    expect(state.publicKey).toBeNull();
    expect(state.userRole).toBe('none');
    expect(state.balance).toBe('0.00');
  });

  it('should change network configs', () => {
    useWalletStore.getState().setNetwork(WalletNetwork.ARBITRUM_ONE);
    
    const state = useWalletStore.getState();
    expect(state.network).toBe(WalletNetwork.ARBITRUM_ONE);
  });
});

