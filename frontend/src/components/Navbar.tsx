'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWalletStore } from '../state/wallet';
import { useTxStore } from '../state/tx';
import { StellarService } from '../services/stellar';
import { Wallet, Menu, X, Shield, Award, User, RefreshCw } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { publicKey, isConnected, userRole, disconnect, setRole } = useWalletStore();
  const { transactions } = useTxStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleSelectOpen, setRoleSelectOpen] = useState(false);

  const pendingCount = transactions.filter((t) => t.status === 'pending' || t.status === 'processing').length;

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Activity Feed', href: '/activity' },
    { label: 'Transaction Center', href: '/tx-center' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'Settings', href: '/settings' }
  ];

  const handleConnect = async (role: 'admin' | 'donor' | 'beneficiary') => {
    try {
      await StellarService.connectWallet(role);
      setRoleSelectOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <nav className="sticky top-0 z-50 h-16 w-full border-b border-hairline bg-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-serif text-2xl font-medium tracking-tight text-ink">
            Truvial
          </span>
          <span className="rounded-full bg-surface-elevated px-2 py-0.5 font-mono text-[10px] text-mute border border-hairline">
            v1.0
          </span>
        </Link>

        {/* Center: Links (Desktop) */}
        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-sans text-[13px] font-medium transition-colors hover:text-ink ${
                  active ? 'text-ink' : 'text-mute'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right: Wallet Connection & Stats */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Pending Tx Badge */}
          {pendingCount > 0 && (
            <Link
              href="/tx-center"
              className="flex items-center space-x-1.5 rounded-full bg-accent-blue-glow/10 px-3 py-1 border border-accent-blue/30 text-accent-blue hover:bg-accent-blue-glow/20 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span className="font-mono text-[11px] font-medium">{pendingCount} Active</span>
            </Link>
          )}

          {isConnected && (
            <span className="flex items-center space-x-1 rounded-full bg-surface-card px-2.5 py-1 text-[11px] border border-hairline font-sans font-medium text-body-text">
              {userRole === 'admin' && <Shield className="mr-1 h-3 w-3 text-accent-red" />}
              {userRole === 'beneficiary' && <Award className="mr-1 h-3 w-3 text-accent-green" />}
              {userRole === 'donor' && <User className="mr-1 h-3 w-3 text-accent-blue" />}
              {userRole.toUpperCase()}
            </span>
          )}

          <div className="relative flex items-center space-x-3 bg-surface-card border border-hairline rounded-full pl-3.5 pr-2 py-1">
            <span className="font-sans text-xs font-semibold text-body-text select-none">
              {isConnected ? (
                <span className="flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-green mr-2 animate-pulse" />
                  {publicKey?.slice(0, 6)}...{publicKey?.slice(-4)}
                </span>
              ) : (
                "Connect Wallet"
              )}
            </span>
            <input
              type="checkbox"
              role="switch"
              className="liquid-3"
              checked={isConnected}
              onChange={() => {
                if (isConnected) {
                  disconnect();
                } else {
                  setRoleSelectOpen(!roleSelectOpen);
                }
              }}
            />

            {roleSelectOpen && !isConnected && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-hairline-strong bg-surface-elevated p-1 shadow-2xl z-50">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-mute">
                  Select Test Profile
                </div>
                <button
                  onClick={() => handleConnect('donor')}
                  className="flex w-full items-center px-3 py-2 text-left font-sans text-xs font-medium text-body-text rounded hover:bg-surface-card hover:text-ink"
                >
                  Donor Profile
                </button>
                <button
                  onClick={() => handleConnect('admin')}
                  className="flex w-full items-center px-3 py-2 text-left font-sans text-xs font-medium text-body-text rounded hover:bg-surface-card hover:text-ink"
                >
                  Charity Admin
                </button>
                <button
                  onClick={() => handleConnect('beneficiary')}
                  className="flex w-full items-center px-3 py-2 text-left font-sans text-xs font-medium text-body-text rounded hover:bg-surface-card hover:text-ink"
                >
                  Beneficiary
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center space-x-3">
          {pendingCount > 0 && (
            <Link
              href="/tx-center"
              className="flex items-center space-x-1 rounded-full bg-accent-blue-glow/10 px-2 py-0.5 border border-accent-blue/30 text-accent-blue text-xs font-mono"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent-blue animate-ping" />
              <span>{pendingCount}</span>
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-mute hover:text-ink"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden w-full border-b border-hairline bg-canvas px-6 py-4 flex flex-col space-y-4">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`font-sans text-[14px] font-medium ${
                  active ? 'text-ink' : 'text-mute'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="border-t border-hairline pt-4 flex flex-col space-y-3">

            {isConnected ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-mute">
                  {publicKey?.slice(0, 10)}...{publicKey?.slice(-4)} ({userRole})
                </span>
                <button
                  onClick={() => {
                    disconnect();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs font-medium text-accent-red"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    handleConnect('donor');
                    setMobileMenuOpen(false);
                  }}
                  className="rounded bg-surface-card py-1.5 text-center font-sans text-xs font-medium border border-hairline text-ink"
                >
                  Donor
                </button>
                <button
                  onClick={() => {
                    handleConnect('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="rounded bg-surface-card py-1.5 text-center font-sans text-xs font-medium border border-hairline text-ink"
                >
                  Admin
                </button>
                <button
                  onClick={() => {
                    handleConnect('beneficiary');
                    setMobileMenuOpen(false);
                  }}
                  className="rounded bg-surface-card py-1.5 text-center font-sans text-xs font-medium border border-hairline text-ink"
                >
                  Beneficiary
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
