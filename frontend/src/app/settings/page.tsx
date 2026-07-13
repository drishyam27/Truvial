'use client';

import React, { useState } from 'react';
import { useWalletStore, WalletNetwork } from '../../state/wallet';
import { Shield, Network, Palette, Settings, Database } from 'lucide-react';

export default function SettingsPage() {
  const { isMockMode, setMockMode, network, setNetwork } = useWalletStore();
  const [rpcUrl, setRpcUrl] = useState('https://soroban-testnet.stellar.org');
  const [treasuryAddr, setTreasuryAddr] = useState('CDDONORSECURETREASURY777KEY');
  const [distributionAddr, setDistributionAddr] = useState('CDDISTRIBUTIONRBACPAYOUTS777KEY');
  const [accentColor, setAccentColor] = useState<'orange' | 'blue' | 'green' | 'red'>('orange');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-hairline pb-6 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-4xl text-ink font-normal">Settings</h1>
          <p className="font-sans text-sm text-charcoal mt-1">
            Configure Stellar/Soroban RPC parameters and client preferences.
          </p>
        </div>
        {isSaved && (
          <span className="font-mono text-xs text-accent-green bg-accent-green-glow/10 border border-accent-green/20 px-3 py-1 rounded">
            Configuration Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Execution Mode */}
        <div className="rounded-lg border border-hairline bg-surface-card p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-accent-orange" />
            <h3 className="font-serif text-xl text-ink font-normal">Execution Mode</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMockMode(true)}
              className={`rounded-lg border p-4 text-left transition-all ${
                isMockMode 
                  ? 'border-accent-orange/50 bg-accent-orange-glow/5' 
                  : 'border-hairline bg-surface-elevated/40 hover:bg-surface-elevated/80'
              }`}
            >
              <div className="font-sans text-sm font-semibold text-ink mb-1">Simulation Mode</div>
              <p className="font-sans text-xs text-charcoal leading-relaxed">
                Interact with simulated ledger states, instant contract executions, and event generation without a wallet configuration.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMockMode(false)}
              className={`rounded-lg border p-4 text-left transition-all ${
                !isMockMode 
                  ? 'border-accent-blue/50 bg-accent-blue-glow/5' 
                  : 'border-hairline bg-surface-elevated/40 hover:bg-surface-elevated/80'
              }`}
            >
              <div className="font-sans text-sm font-semibold text-ink mb-1">Stellar Testnet Node</div>
              <p className="font-sans text-xs text-charcoal leading-relaxed">
                Send transactions to the live Stellar Testnet. Requires Freighter wallet installed and active.
              </p>
            </button>
          </div>
        </div>

        {/* Section 2: Contract Address Mapping */}
        <div className="rounded-lg border border-hairline bg-surface-card p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-accent-blue" />
            <h3 className="font-serif text-xl text-ink font-normal">Contract Deployments</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-mute font-sans font-semibold uppercase tracking-wider mb-2">
                Treasury Contract Address
              </label>
              <input
                type="text"
                value={treasuryAddr}
                onChange={(e) => setTreasuryAddr(e.target.value)}
                className="w-full h-10 rounded border border-hairline-strong bg-canvas px-4 font-mono text-xs text-ink focus:outline-none focus:border-ink"
              />
            </div>
            <div>
              <label className="block text-xs text-mute font-sans font-semibold uppercase tracking-wider mb-2">
                Distribution Contract Address
              </label>
              <input
                type="text"
                value={distributionAddr}
                onChange={(e) => setDistributionAddr(e.target.value)}
                className="w-full h-10 rounded border border-hairline-strong bg-canvas px-4 font-mono text-xs text-ink focus:outline-none focus:border-ink"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Soroban RPC Endpoint */}
        <div className="rounded-lg border border-hairline bg-surface-card p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <Network className="h-5 w-5 text-accent-green" />
            <h3 className="font-serif text-xl text-ink font-normal">Soroban Network Configuration</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-mute font-sans uppercase mb-1.5">RPC Endpoint</label>
              <input
                type="url"
                value={rpcUrl}
                onChange={(e) => setRpcUrl(e.target.value)}
                className="w-full h-9 rounded border border-hairline-strong bg-canvas px-3 text-xs text-ink focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-mute font-sans uppercase mb-1.5">Target Network</label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value as WalletNetwork)}
                className="w-full h-9 rounded border border-hairline-strong bg-canvas px-3 text-xs text-ink focus:outline-none"
              >
                <option value={WalletNetwork.TESTNET}>Stellar Testnet</option>
                <option value={WalletNetwork.PUBLIC}>Stellar Public Mainnet</option>
                <option value={WalletNetwork.STANDALONE}>Local Standalone Sandbox</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Signature Accent Glow Theme */}
        <div className="rounded-lg border border-hairline bg-surface-card p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <Palette className="h-5 w-5 text-accent-yellow" />
            <h3 className="font-serif text-xl text-ink font-normal">Atmospheric Accent Customization</h3>
          </div>
          <div className="flex space-x-4">
            {(['orange', 'blue', 'green', 'red'] as const).map((color) => (
              <button
                type="button"
                key={color}
                onClick={() => setAccentColor(color)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
                  accentColor === color 
                    ? 'border-ink scale-110 shadow-lg' 
                    : 'border-hairline hover:scale-105'
                }`}
                style={{
                  backgroundColor: 
                    color === 'orange' ? '#ff801f' : 
                    color === 'blue' ? '#3b9eff' : 
                    color === 'green' ? '#11ff99' : '#ff2047'
                }}
                title={`${color.toUpperCase()} Glow`}
              />
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full h-11 flex items-center justify-center rounded bg-primary-white font-sans text-sm font-bold text-primary-on hover:bg-white/95"
        >
          Save Configuration
        </button>
      </form>
    </div>
  );
}
