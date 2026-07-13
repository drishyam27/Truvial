import { describe, it, expect, beforeEach } from 'vitest';
import { useWalletStore, WalletNetwork } from '../state/wallet';

describe('useWalletStore unit tests', () => {
  beforeEach(() => {
    // Reset state before each test
    useWalletStore.setState({
      publicKey: null,
      isConnected: false,
      network: WalletNetwork.TESTNET,
      balance: '0.00',
      isMockMode: true,
      userRole: 'none'
    });
  });

  it('should initialize with correct default values', () => {
    const state = useWalletStore.getState();
    expect(state.isConnected).toBe(false);
    expect(state.publicKey).toBeNull();
    expect(state.isMockMode).toBe(true);
    expect(state.userRole).toBe('none');
    expect(state.balance).toBe('0.00');
  });

  it('should connect user successfully and set role-specific mock balances', () => {
    const mockAddress = 'GBADMIN777...TRUVIAL';
    
    // Connect as admin
    useWalletStore.getState().connect(mockAddress, 'admin');
    let state = useWalletStore.getState();
    expect(state.isConnected).toBe(true);
    expect(state.publicKey).toBe(mockAddress);
    expect(state.userRole).toBe('admin');
    expect(state.balance).toBe('12500.50');

    // Connect as donor
    useWalletStore.getState().connect(mockAddress, 'donor');
    state = useWalletStore.getState();
    expect(state.userRole).toBe('donor');
    expect(state.balance).toBe('850.25');
  });

  it('should disconnect and clear all states', () => {
    const mockAddress = 'GBDONOR888...ALICE';
    useWalletStore.getState().connect(mockAddress, 'donor');
    
    useWalletStore.getState().disconnect();
    const state = useWalletStore.getState();
    expect(state.isConnected).toBe(false);
    expect(state.publicKey).toBeNull();
    expect(state.userRole).toBe('none');
    expect(state.balance).toBe('0.00');
  });

  it('should change mock mode and network configs', () => {
    useWalletStore.getState().setMockMode(false);
    useWalletStore.getState().setNetwork(WalletNetwork.PUBLIC);
    
    const state = useWalletStore.getState();
    expect(state.isMockMode).toBe(false);
    expect(state.network).toBe(WalletNetwork.PUBLIC);
  });
});
