'use client';

import React, { useState, useEffect } from 'react';
import { useWalletStore, WalletType } from '../state/wallet';
import { ArbitrumService } from '../services/arbitrum';
import { X, Check, Copy, Shield, Award, User, Sparkles, LogOut, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { 
    publicKey, 
    isConnected, 
    userRole, 
    walletType, 
    network, 
    balance, 
    currency,
    setRole, 
    disconnect 
  } = useWalletStore();

  const [selectedRole, setSelectedRole] = useState<'admin' | 'donor' | 'beneficiary'>('donor');
  const [connectingType, setConnectingType] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasMetaMaskInstalled, setHasMetaMaskInstalled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasMetaMaskInstalled(!!(window as any).ethereum);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async (type: WalletType) => {
    setErrorMessage(null);
    setConnectingType(type);
    try {
      if (type === 'metamask') {
        await ArbitrumService.connectMetaMask(selectedRole);
      } else {
        await ArbitrumService.connectSimulated(selectedRole);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Connection failed');
    } finally {
      setConnectingType(null);
    }
  };

  const handleCopy = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Card */}
      <div 
        className="relative w-full max-w-md rounded-2xl border border-hairline-strong bg-surface-elevated shadow-2xl p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow effects */}
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-accent-orange/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-accent-blue/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-hairline">
          <div>
            <h3 className="font-serif text-lg font-semibold text-ink">
              {isConnected ? 'Wallet Connected' : 'Connect to Arbitrum'}
            </h3>
            <p className="font-sans text-xs text-mute mt-0.5">
              {isConnected 
                ? 'Manage active account, role & network'
                : 'Select your preferred Arbitrum provider or demo role'
              }
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-mute hover:text-ink hover:bg-surface-card transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 flex items-start space-x-2.5 rounded-xl border border-accent-red/30 bg-accent-red/10 p-3 text-xs text-accent-red">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Body: Connected State */}
        {isConnected ? (
          <div className="mt-4 space-y-4">
            {/* Account Card */}
            <div className="p-4 rounded-xl bg-surface-card border border-hairline space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-mute">
                  Active EVM Account
                </span>
                <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-green/10 text-accent-green border border-accent-green/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse" />
                  <span>
                    {walletType === 'metamask' ? 'MetaMask (Injected)' : 'Demo Profile'}
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between bg-surface-elevated p-2.5 rounded-lg border border-hairline">
                <span className="font-mono text-xs text-ink truncate max-w-[260px]">
                  {publicKey}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 text-xs text-mute hover:text-ink transition-colors ml-2"
                  title="Copy address"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-accent-green" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2 rounded-lg bg-surface-elevated/50 border border-hairline/50">
                  <div className="text-[10px] text-mute uppercase font-mono">Balance</div>
                  <div className="font-semibold text-ink mt-0.5">{balance} {currency}</div>
                </div>
                <div className="p-2 rounded-lg bg-surface-elevated/50 border border-hairline/50">
                  <div className="text-[10px] text-mute uppercase font-mono">Network</div>
                  <div className="font-semibold text-ink mt-0.5 truncate">{network}</div>
                </div>
              </div>
            </div>

            {/* Role Switcher */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-mute block mb-2">
                Active Test Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setRole('donor')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    userRole === 'donor'
                      ? 'border-accent-blue bg-accent-blue/10 text-accent-blue font-semibold'
                      : 'border-hairline bg-surface-card text-mute hover:text-ink hover:bg-surface-elevated'
                  }`}
                >
                  <User className="h-4 w-4 mb-1" />
                  <span>Donor</span>
                </button>
                <button
                  onClick={() => setRole('admin')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    userRole === 'admin'
                      ? 'border-accent-red bg-accent-red/10 text-accent-red font-semibold'
                      : 'border-hairline bg-surface-card text-mute hover:text-ink hover:bg-surface-elevated'
                  }`}
                >
                  <Shield className="h-4 w-4 mb-1" />
                  <span>Admin</span>
                </button>
                <button
                  onClick={() => setRole('beneficiary')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    userRole === 'beneficiary'
                      ? 'border-accent-green bg-accent-green/10 text-accent-green font-semibold'
                      : 'border-hairline bg-surface-card text-mute hover:text-ink hover:bg-surface-elevated'
                  }`}
                >
                  <Award className="h-4 w-4 mb-1" />
                  <span>Beneficiary</span>
                </button>
              </div>
            </div>

            {/* Disconnect button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  disconnect();
                  onClose();
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-accent-red/30 bg-accent-red/10 text-accent-red hover:bg-accent-red hover:text-white font-sans text-xs font-semibold transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Disconnect Wallet</span>
              </button>
            </div>
          </div>
        ) : (
          /* Body: Disconnected / Connect Selection */
          <div className="mt-4 space-y-4">
            {/* Step 1: Select Profile Role */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-mute">
                  1. Choose Initial Profile
                </span>
                <span className="text-[10px] text-mute">Role permissions</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedRole('donor')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all ${
                    selectedRole === 'donor'
                      ? 'border-accent-orange bg-accent-orange/10 text-accent-orange font-semibold'
                      : 'border-hairline bg-surface-card text-mute hover:text-ink hover:bg-surface-elevated'
                  }`}
                >
                  <User className="h-4 w-4 mb-0.5" />
                  <span>Donor</span>
                </button>
                <button
                  onClick={() => setSelectedRole('admin')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all ${
                    selectedRole === 'admin'
                      ? 'border-accent-red bg-accent-red/10 text-accent-red font-semibold'
                      : 'border-hairline bg-surface-card text-mute hover:text-ink hover:bg-surface-elevated'
                  }`}
                >
                  <Shield className="h-4 w-4 mb-0.5" />
                  <span>Admin</span>
                </button>
                <button
                  onClick={() => setSelectedRole('beneficiary')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all ${
                    selectedRole === 'beneficiary'
                      ? 'border-accent-green bg-accent-green/10 text-accent-green font-semibold'
                      : 'border-hairline bg-surface-card text-mute hover:text-ink hover:bg-surface-elevated'
                  }`}
                >
                  <Award className="h-4 w-4 mb-0.5" />
                  <span>Beneficiary</span>
                </button>
              </div>
            </div>

            {/* Step 2: Choose Wallet */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-mute">
                  2. Select Arbitrum Provider
                </span>
              </div>

              <div className="space-y-2.5">
                {/* MetaMask / EVM */}
                <button
                  onClick={() => handleConnect('metamask')}
                  disabled={connectingType !== null}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-hairline bg-surface-card hover:bg-surface-elevated hover:border-hairline-strong text-left transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-[#F6851B]/15 border border-[#F6851B]/30 flex items-center justify-center shrink-0">
                      {/* MetaMask Fox SVG */}
                      <svg className="h-6 w-6" viewBox="0 0 318.6 318.6" fill="none">
                        <path d="M274.1 35.5l-99.5 73.9L193 65.4z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M44.4 35.5l98.7 74.6-18.4-44.7z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M238.3 206.8l-26.6 40.9 57.6 15.8 16.5-56z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M32.8 207.5l16.4 56 57.7-15.8-26.6-40.9z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M96.8 136.4l-15.2 22.9 54.5 2.4-1.8-58.7z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M221.7 136.4l-37.7-33.4-1.7 58.7 54.6-2.4z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M106.8 247.7l33.8-16.5-29.2-22.8z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M177.9 231.2l33.9 16.5-4.7-39.3z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M178.5 175.7l-38.4-11.4-38.4 11.4 6.2 24.3 32.2 22 32.2-22z" fill="#233238" stroke="#233238" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <div className="font-sans text-xs font-semibold text-ink group-hover:text-accent-orange transition-colors flex items-center space-x-1.5">
                        <span>MetaMask & Injected EVM</span>
                        {hasMetaMaskInstalled ? (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-accent-green/10 text-accent-green border border-accent-green/20">
                            Detected
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-accent-orange/10 text-accent-orange border border-accent-orange/20">
                            Recommended
                          </span>
                        )}
                      </div>
                      <div className="font-sans text-[11px] text-mute">
                        Arbitrum Sepolia & Nitro Stylus EVM
                      </div>
                    </div>
                  </div>

                  {connectingType === 'metamask' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-accent-orange" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-mute group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
                  )}
                </button>

                {/* Simulated Profile (Instant Demo) */}
                <button
                  onClick={() => handleConnect('simulated')}
                  disabled={connectingType !== null}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-hairline bg-surface-card hover:bg-surface-elevated hover:border-hairline-strong text-left transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-accent-orange/15 border border-accent-orange/30 flex items-center justify-center shrink-0">
                      <Sparkles className="h-5 w-5 text-accent-orange" />
                    </div>
                    <div>
                      <div className="font-sans text-xs font-semibold text-ink group-hover:text-accent-orange transition-colors flex items-center space-x-1.5">
                        <span>Instant Demo Account</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-accent-orange/10 text-accent-orange border border-accent-orange/20">
                          1-Click
                        </span>
                      </div>
                      <div className="font-sans text-[11px] text-mute">
                        Test without installing browser extension or testnet faucet
                      </div>
                    </div>
                  </div>

                  {connectingType === 'simulated' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-accent-orange" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-mute group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
