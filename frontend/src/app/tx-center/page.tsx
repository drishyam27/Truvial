'use client';

import React, { useState } from 'react';
import { useTxStore, Transaction } from '../../state/tx';
import { StellarService } from '../../services/stellar';
import { RefreshCw, CheckCircle, XCircle, Clock, ExternalLink, Trash2, RotateCcw } from 'lucide-react';

export default function TxCenterPage() {
  const { transactions, clearTransactions, updateTransaction } = useTxStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'failed'>('all');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const filteredTxs = transactions.filter((tx) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return tx.status === 'pending' || tx.status === 'processing';
    return tx.status === filter;
  });

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center space-x-1.5 rounded-full bg-accent-yellow-glow/10 border border-accent-yellow/20 px-3 py-1 text-accent-yellow text-xs font-mono">
            <Clock className="h-3.5 w-3.5" />
            <span>Pending</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center space-x-1.5 rounded-full bg-accent-blue-glow/10 border border-accent-blue/20 px-3 py-1 text-accent-blue text-xs font-mono">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Processing</span>
          </div>
        );
      case 'confirmed':
        return (
          <div className="flex items-center space-x-1.5 rounded-full bg-accent-green-glow/10 border border-accent-green/20 px-3 py-1 text-accent-green text-xs font-mono">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Confirmed</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center space-x-1.5 rounded-full bg-accent-red-glow/10 border border-accent-red/20 px-3 py-1 text-accent-red text-xs font-mono">
            <XCircle className="h-3.5 w-3.5" />
            <span>Failed</span>
          </div>
        );
    }
  };

  const handleRetry = async (tx: Transaction) => {
    setRetryingId(tx.id);
    try {
      // Simulate/trigger a new donation or call based on title
      if (tx.amount) {
        await StellarService.donate(Number(tx.amount));
      } else {
        // Simple fallback simulation
        updateTransaction(tx.id, { status: 'pending', error: undefined });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        updateTransaction(tx.id, { status: 'processing' });
        await new Promise((resolve) => setTimeout(resolve, 1500));
        updateTransaction(tx.id, { 
          status: 'confirmed', 
          hash: '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
        });
      }
    } catch (err: any) {
      console.error('Retry failed', err);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-hairline pb-6 gap-4">
        <div>
          <h1 className="font-serif text-4xl text-ink font-normal">Transaction Center</h1>
          <p className="font-sans text-sm text-charcoal mt-1">
            Real-time Soroban ledger transaction monitor and error handler.
          </p>
        </div>
        {transactions.length > 0 && (
          <button
            onClick={clearTransactions}
            className="flex h-9 items-center justify-center rounded border border-hairline-strong bg-surface-elevated px-4 font-sans text-xs font-medium text-accent-red hover:bg-accent-red/10 transition-colors space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-hairline pb-4">
        {(['all', 'pending', 'confirmed', 'failed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-full font-sans text-xs font-semibold capitalize transition-all border ${
              filter === tab
                ? 'bg-primary-white text-primary-on border-transparent'
                : 'bg-surface-elevated text-mute border-hairline hover:text-ink'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTxs.length === 0 ? (
          <div className="text-center py-20 border border-hairline rounded-lg bg-surface-card text-mute">
            No transactions found matching the filter.
          </div>
        ) : (
          filteredTxs.map((tx) => (
            <div
              key={tx.id}
              className="rounded-lg border border-hairline bg-surface-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-hairline-strong"
            >
              {/* Left Column: Title & Metadata */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="font-sans text-sm font-semibold text-ink">{tx.title}</h3>
                  <span className="font-mono text-[10px] text-mute">ID: {tx.id}</span>
                </div>
                
                {tx.hash && (
                  <div className="flex items-center space-x-2">
                    <span className="font-sans text-[11px] text-mute">Hash:</span>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 font-mono text-[11px] text-accent-blue hover:underline"
                    >
                      <span>{tx.hash}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {tx.error && (
                  <div className="rounded bg-accent-red-glow/10 border border-accent-red/20 px-3 py-1.5 font-mono text-xs text-accent-red max-w-xl">
                    {tx.error}
                  </div>
                )}
                
                <div className="text-[11px] text-ash font-mono">
                  Submitted at: {new Date(tx.timestamp).toLocaleString()}
                </div>
              </div>

              {/* Right Column: Status & Action */}
              <div className="flex items-center space-x-4 border-t border-hairline/30 md:border-none pt-3 md:pt-0 justify-between md:justify-end">
                {getStatusBadge(tx.status)}

                {tx.status === 'failed' && (
                  <button
                    onClick={() => handleRetry(tx)}
                    disabled={retryingId === tx.id}
                    className="flex h-8 w-8 items-center justify-center rounded border border-hairline bg-surface-elevated text-mute hover:text-ink transition-colors disabled:opacity-50"
                    title="Retry transaction"
                  >
                    <RotateCcw className={`h-4 w-4 ${retryingId === tx.id ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
