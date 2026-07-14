'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWalletStore } from '../state/wallet';
import { useTxStore } from '../state/tx';
import { StellarService } from '../services/stellar';
import { Wallet, Menu, X, Shield, Award, User, RefreshCw, Copy, Check } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { publicKey, isConnected, userRole, disconnect, setRole } = useWalletStore();
  const { transactions } = useTxStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleSelectOpen, setRoleSelectOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('truvial_theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.classList.toggle('light', savedTheme === 'light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('truvial_theme', nextTheme);
    document.body.classList.toggle('light', nextTheme === 'light');
  };

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
    <nav className="sticky top-0 z-50 h-16 w-full border-b border-hairline bg-canvas/30 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 relative">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center space-x-2 select-none">
          <span className="font-serif text-2xl font-medium tracking-tight text-ink">
            Truvial
          </span>
          <span className="rounded-full bg-surface-elevated px-2 py-0.5 font-mono text-[10px] text-mute border border-hairline">
            v1.0
          </span>
        </Link>

        {/* Absolute Burger Menu positioned exactly below the navbar border on the left */}
        <div className="absolute left-16 top-[68px] z-50 hidden md:block">
          <label className="buttons__burger" htmlFor="burger">
            <input
              type="checkbox"
              id="burger"
              checked={menuDropdownOpen}
              onChange={(e) => setMenuDropdownOpen(e.target.checked)}
            />
            <span></span>
            <span></span>
            <span></span>
          </label>

          {menuDropdownOpen && (
            <div className="absolute left-0 mt-3 w-56 rounded-lg border border-hairline-strong bg-surface-elevated p-1 shadow-2xl z-50">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-mute border-b border-hairline mb-1 select-none">
                Menu
              </div>
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuDropdownOpen(false)}
                    className={`flex w-full items-center px-3 py-2 text-left font-sans text-xs font-semibold rounded hover:bg-surface-card hover:text-ink ${
                      active ? 'text-ink bg-surface-card/50' : 'text-mute'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Center: Empty to maintain space */}
        <div className="hidden md:block flex-1" />

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
          {/* Theme Toggle */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-card transition-colors mr-1">
            <label htmlFor="themeToggle" className="themeToggle st-sunMoonThemeToggleBtn w-5 h-5 flex items-center justify-center relative">
              <input
                type="checkbox"
                id="themeToggle"
                className="themeToggleInput absolute inset-0 opacity-0 cursor-pointer"
                checked={theme === 'light'}
                onChange={toggleTheme}
              />
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="currentColor"
                stroke="none"
                className="text-mute hover:text-ink transition-colors"
              >
                <mask id="moon-mask">
                  <rect x="0" y="0" width="20" height="20" fill="white"></rect>
                  <circle cx="11" cy="3" r="8" fill="black"></circle>
                </mask>
                <circle
                  className="sunMoon"
                  cx="10"
                  cy="10"
                  r="8"
                  mask="url(#moon-mask)"
                ></circle>
                <g>
                  <circle className="sunRay sunRay1" cx="18" cy="10" r="1.5"></circle>
                  <circle className="sunRay sunRay2" cx="14" cy="16.928" r="1.5"></circle>
                  <circle className="sunRay sunRay3" cx="6" cy="16.928" r="1.5"></circle>
                  <circle className="sunRay sunRay4" cx="2" cy="10" r="1.5"></circle>
                  <circle className="sunRay sunRay5" cx="6" cy="3.1718" r="1.5"></circle>
                  <circle className="sunRay sunRay6" cx="14" cy="3.1718" r="1.5"></circle>
                </g>
              </svg>
            </label>
          </div>

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

            {isConnected && (
              <button
                onClick={async () => {
                  if (publicKey) {
                    await navigator.clipboard.writeText(publicKey);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }
                }}
                className="flex items-center justify-center p-1 rounded-full text-mute hover:text-ink hover:bg-surface-elevated transition-all"
                title="Copy Address"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-accent-green" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            )}

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
          {/* Mobile Theme Toggle */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-card transition-colors mr-1">
            <label htmlFor="themeToggleMobile" className="themeToggle st-sunMoonThemeToggleBtn w-5 h-5 flex items-center justify-center relative">
              <input
                type="checkbox"
                id="themeToggleMobile"
                className="themeToggleInput absolute inset-0 opacity-0 cursor-pointer"
                checked={theme === 'light'}
                onChange={toggleTheme}
              />
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="currentColor"
                stroke="none"
                className="text-mute hover:text-ink transition-colors"
              >
                <mask id="moon-mask-mobile">
                  <rect x="0" y="0" width="20" height="20" fill="white"></rect>
                  <circle cx="11" cy="3" r="8" fill="black"></circle>
                </mask>
                <circle
                  className="sunMoon"
                  cx="10"
                  cy="10"
                  r="8"
                  mask="url(#moon-mask-mobile)"
                ></circle>
                <g>
                  <circle className="sunRay sunRay1" cx="18" cy="10" r="1.5"></circle>
                  <circle className="sunRay sunRay2" cx="14" cy="16.928" r="1.5"></circle>
                  <circle className="sunRay sunRay3" cx="6" cy="16.928" r="1.5"></circle>
                  <circle className="sunRay sunRay4" cx="2" cy="10" r="1.5"></circle>
                  <circle className="sunRay sunRay5" cx="6" cy="3.1718" r="1.5"></circle>
                  <circle className="sunRay sunRay6" cx="14" cy="3.1718" r="1.5"></circle>
                </g>
              </svg>
            </label>
          </div>

          {pendingCount > 0 && (
            <Link
              href="/tx-center"
              className="flex items-center space-x-1 rounded-full bg-accent-blue-glow/10 px-2.5 py-0.5 border border-accent-blue/30 text-accent-blue text-xs font-mono mr-1"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent-blue animate-ping" />
              <span>{pendingCount}</span>
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-mute hover:text-ink transition-colors p-1"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden w-full border-b border-hairline bg-canvas px-6 py-4 flex flex-col space-y-4 shadow-xl">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`font-sans text-[14px] font-semibold transition-colors ${
                  active ? 'text-ink' : 'text-mute hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="border-t border-hairline pt-4 flex flex-col space-y-3 relative">
            <div className="flex items-center justify-between">
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

              <div className="flex items-center space-x-3">
                {isConnected && (
                  <button
                    onClick={async () => {
                      if (publicKey) {
                        await navigator.clipboard.writeText(publicKey);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }
                    }}
                    className="flex items-center justify-center p-1 rounded hover:bg-surface-elevated text-mute hover:text-ink transition-all"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-accent-green" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}

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
              </div>
            </div>

            {isConnected && (
              <div className="flex items-center space-x-1.5 text-[11px] font-sans font-medium text-mute bg-surface-card border border-hairline px-3 py-1.5 rounded-lg select-none">
                {userRole === 'admin' && <Shield className="h-3 w-3 text-accent-red" />}
                {userRole === 'beneficiary' && <Award className="h-3 w-3 text-accent-green" />}
                {userRole === 'donor' && <User className="h-3 w-3 text-accent-blue" />}
                <span>Role: {userRole.toUpperCase()}</span>
              </div>
            )}

            {roleSelectOpen && !isConnected && (
              <div className="w-full mt-2 rounded-lg border border-hairline-strong bg-surface-elevated p-1 shadow-2xl z-50">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-mute border-b border-hairline mb-1 select-none">
                  Select Test Profile
                </div>
                <button
                  onClick={() => {
                    handleConnect('donor');
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-2 text-left font-sans text-xs font-semibold text-body-text rounded hover:bg-surface-card hover:text-ink"
                >
                  Donor Profile
                </button>
                <button
                  onClick={() => {
                    handleConnect('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-2 text-left font-sans text-xs font-semibold text-body-text rounded hover:bg-surface-card hover:text-ink"
                >
                  Charity Admin
                </button>
                <button
                  onClick={() => {
                    handleConnect('beneficiary');
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-2 text-left font-sans text-xs font-semibold text-body-text rounded hover:bg-surface-card hover:text-ink"
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
