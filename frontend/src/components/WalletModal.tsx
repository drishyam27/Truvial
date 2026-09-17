'use client';

import React, { useState, useEffect } from 'react';
import { useWalletStore, WalletNetwork, WalletType } from '../state/wallet';
import { ArbitrumService } from '../services/arbitrum';
import { X, Check, Copy, ExternalLink, Shield, Award, User, Sparkles, LogOut, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

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
  const [hasFreighterInstalled, setHasFreighterInstalled] = useState(false);
  const [hasMetaMaskInstalled, setHasMetaMaskInstalled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasMetaMaskInstalled(!!(window as any).ethereum);
      setHasFreighterInstalled(!!(window as any).freighter);
      
      // Async check for freighter
      import('@stellar/freighter-api')
        .then((f) => f.isConnected())
        .then((status) => {
          if (status?.isConnected) setHasFreighterInstalled(true);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async (type: WalletType) => {
    setErrorMessage(null);
    setConnectingType(type);
    try {
      if (type === 'freighter') {
        await ArbitrumService.connectFreighter(selectedRole);
      } else if (type === 'metamask') {
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
              {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
            </h3>
            <p className="font-sans text-xs text-mute mt-0.5">
              {isConnected 
                ? 'Manage active account, role & network'
                : 'Select your preferred Web3 provider or role'
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
              {errorMessage.includes('freighter.app') && (
                <div className="mt-1.5">
                  <a 
                    href="https://www.freighter.app/" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 font-semibold underline hover:text-ink"
                  >
                    <span>Download Freighter Extension</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
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
                  Active Account
                </span>
                <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-green/10 text-accent-green border border-accent-green/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse" />
                  <span>
                    {walletType === 'freighter' ? 'Freighter (Stellar)' : walletType === 'metamask' ? 'MetaMask (EVM)' : 'Demo Profile'}
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
                <span className="text-[10px] text-mute">Configures test permissions</span>
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
                  2. Select Wallet Provider
                </span>
              </div>

              <div className="space-y-2">
                {/* MetaMask / EVM */}
                <button
                  onClick={() => handleConnect('metamask')}
                  disabled={connectingType !== null}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-hairline bg-surface-card hover:bg-surface-elevated hover:border-hairline-strong text-left transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-xl bg-[#F6851B]/15 border border-[#F6851B]/30 flex items-center justify-center shrink-0">
                      {/* MetaMask Fox SVG */}
                      <svg className="h-5 w-5" viewBox="0 0 318.6 318.6" fill="none">
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
                        <span>MetaMask</span>
                        {hasMetaMaskInstalled && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-accent-green/10 text-accent-green border border-accent-green/20">
                            Detected
                          </span>
                        )}
                      </div>
                      <div className="font-sans text-[11px] text-mute">
                        Arbitrum Sepolia & Nitro EVM
                      </div>
                    </div>
                  </div>

                  {connectingType === 'metamask' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-accent-orange" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-mute group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
                  )}
                </button>

                {/* Freighter Wallet (Stellar) */}
                <button
                  onClick={() => handleConnect('freighter')}
                  disabled={connectingType !== null}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-hairline bg-surface-card hover:bg-surface-elevated hover:border-hairline-strong text-left transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-xl bg-[#5C42FF]/15 border border-[#5C42FF]/30 flex items-center justify-center shrink-0">
                      {/* Freighter Rocket / Stellar SVG */}
                      <svg className="h-5 w-5 text-[#8875FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
                        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
                      </svg>
                    </div>
                    <div>
                      <div className="font-sans text-xs font-semibold text-ink group-hover:text-[#8875FF] transition-colors flex items-center space-x-1.5">
                        <span>Freighter Wallet</span>
                        {hasFreighterInstalled ? (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-accent-green/10 text-accent-green border border-accent-green/20">
                            Detected
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-surface-elevated text-mute border border-hairline">
                            Stellar
                          </span>
                        )}
                      </div>
                      <div className="font-sans text-[11px] text-mute">
                        Stellar Network (XLM & Soroban)
                      </div>
                    </div>
                  </div>

                  {connectingType === 'freighter' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#8875FF]" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-mute group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
                  )}
                </button>

                {/* Simulated Profile (Instant Demo) */}
                <button
                  onClick={() => handleConnect('simulated')}
                  disabled={connectingType !== null}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-hairline bg-surface-card hover:bg-surface-elevated hover:border-hairline-strong text-left transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-xl bg-accent-orange/15 border border-accent-orange/30 flex items-center justify-center shrink-0">
                      <Sparkles className="h-5 w-5 text-accent-orange" />
                    </div>
                    <div>
                      <div className="font-sans text-xs font-semibold text-ink group-hover:text-accent-orange transition-colors flex items-center space-x-1.5">
                        <span>Instant Test Account</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-accent-orange/10 text-accent-orange border border-accent-orange/20">
                          1-Click Demo
                        </span>
                      </div>
                      <div className="font-sans text-[11px] text-mute">
                        Test without installing browser extensions
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
