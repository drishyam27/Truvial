import { describe, it, expect, beforeEach } from 'vitest';
import { useTxStore } from '../state/tx';

describe('useTxStore unit tests', () => {
  beforeEach(() => {
    useTxStore.setState({
      transactions: []
    });
  });

  it('should start with an empty transaction queue', () => {
    const state = useTxStore.getState();
    expect(state.transactions).toEqual([]);
  });

  it('should add a transaction in pending state', () => {
    useTxStore.getState().addTransaction({
      id: 'tx_1',
      title: 'Submit Donation',
      status: 'pending',
      amount: '100'
    });

    const state = useTxStore.getState();
    expect(state.transactions.length).toBe(1);
    expect(state.transactions[0].id).toBe('tx_1');
    expect(state.transactions[0].status).toBe('pending');
    expect(state.transactions[0].hash).toBeNull();
    expect(state.transactions[0].amount).toBe('100');
  });

  it('should update transaction status and assign transaction hashes', () => {
    useTxStore.getState().addTransaction({
      id: 'tx_2',
      title: 'Approve Milestone',
      status: 'pending'
    });

    // Move to processing
    useTxStore.getState().updateTransaction('tx_2', { status: 'processing' });
    let state = useTxStore.getState();
    expect(state.transactions[0].status).toBe('processing');

    // Confirm with hash
    const mockHash = '0xabc123';
    useTxStore.getState().updateTransaction('tx_2', { status: 'confirmed', hash: mockHash });
    state = useTxStore.getState();
    expect(state.transactions[0].status).toBe('confirmed');
    expect(state.transactions[0].hash).toBe(mockHash);
  });

  it('should handle failures with custom error logs', () => {
    useTxStore.getState().addTransaction({
      id: 'tx_3',
      title: 'Create Project',
      status: 'pending'
    });

    const errorMsg = 'Stellar Testnet node timeout';
    useTxStore.getState().updateTransaction('tx_3', { status: 'failed', error: errorMsg });
    
    const state = useTxStore.getState();
    expect(state.transactions[0].status).toBe('failed');
    expect(state.transactions[0].error).toBe(errorMsg);
  });

  it('should clear transaction queue history successfully', () => {
    useTxStore.getState().addTransaction({ id: 't1', title: 'Tx 1', status: 'confirmed' });
    useTxStore.getState().addTransaction({ id: 't2', title: 'Tx 2', status: 'failed' });
    
    useTxStore.getState().clearTransactions();
    const state = useTxStore.getState();
    expect(state.transactions).toEqual([]);
  });
});
