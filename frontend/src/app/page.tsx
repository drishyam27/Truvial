'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Lock, CheckCircle, Eye, Code } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative py-12 md:py-24">
      {/* Background Radial Glow */}
      <div className="absolute top-[-96px] left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] glow-orange pointer-events-none z-0" />

      {/* Hero Section */}
      <div className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center">
        {/* Domaine Display Serif Headline */}
        <h1 className="font-serif text-[48px] md:text-[88px] leading-[1.0] tracking-[-1.5px] text-ink font-normal mb-8 max-w-3xl">
          Donation Transparency, Solved.
        </h1>

        {/* Humanist Subtitle */}
        <p className="font-sans text-lg md:text-xl text-charcoal max-w-2xl leading-relaxed mb-10">
          Truvial is a decentralized, milestone-based charity treasury management platform. Donors lock funds securely, while beneficiaries unlock capital by completing real-world tasks.
        </p>

        {/* Premium CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/dashboard"
            className="flex h-11 items-center justify-center rounded-md bg-primary-white px-6 font-sans text-sm font-semibold text-primary-on transition-all hover:bg-white/90 shadow-lg"
          >
            Launch Application <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/tx-center"
            className="flex h-11 items-center justify-center rounded-md border border-hairline-strong bg-surface-elevated px-6 font-sans text-sm font-medium text-ink transition-colors hover:bg-surface-card"
          >
            Monitor Network
          </Link>
        </div>
      </div>

      {/* Interactive Code Window & Benefits Split */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 mt-16 max-w-6xl mx-auto items-center">
        {/* Left Side: Code Mockup representing Soroban Contract Interface */}
        <div className="rounded-lg border border-hairline-strong bg-surface-deep p-6 font-mono text-[13px] leading-relaxed text-body-text shadow-2xl relative">
          {/* Traffic Lights Chrome */}
          <div className="flex space-x-2 mb-4">
            <span className="h-3 w-3 rounded-full bg-accent-red" />
            <span className="h-3 w-3 rounded-full bg-accent-yellow" />
            <span className="h-3 w-3 rounded-full bg-accent-green" />
          </div>
          <div className="border-b border-hairline pb-2 mb-4 flex justify-between items-center text-mute text-xs">
            <span>distribution/src/lib.rs</span>
            <span className="font-sans font-semibold text-accent-orange">Arbitrum Stylus (Rust WASM)</span>
          </div>
          <pre className="overflow-x-auto text-[11px] md:text-[13px]">
            <code className="text-mute">
              {`#[public]
impl Distribution {
    pub fn release_milestone_funds(&mut self, project_id: U256, milestone_id: U256) -> Result<(), Vec<u8>> {
        if msg::sender() != self.admin.get() {
            return Err("unauthorized: caller is not admin".into());
        }

        let key = Self::milestone_key(project_id, milestone_id);
        let mut milestone = self.milestones.setter(key);
        assert_eq!(milestone.status.get(), U256::from(1)); // Must be approved

        milestone.status.set(U256::from(2)); // Paid
        let beneficiary = self.projects.get(project_id).beneficiary.get();
        let amount = milestone.amount.get();

        // Cross-contract call to Treasury on Arbitrum Nitro
        let treasury = ITreasury::new(self.treasury.get());
        treasury.release_funds(Call::new(), beneficiary, amount)?;
        Ok(())
    }
}`}
            </code>
          </pre>
        </div>

        {/* Right Side: Visual Benefits */}
        <div className="flex flex-col space-y-8">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-surface-card border border-hairline rounded-lg text-accent-orange">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-sans text-[18px] font-semibold text-ink mb-2">Stylus Escrow Vault</h3>
              <p className="font-sans text-sm text-charcoal leading-relaxed">
                Donor capital is locked directly in the Stylus Treasury contract. Beneficiary payouts are enforced via cryptographic EVM permissions.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="p-3 bg-surface-card border border-hairline rounded-lg text-accent-green">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-sans text-[18px] font-semibold text-ink mb-2">Milestone-Bound Releases</h3>
              <p className="font-sans text-sm text-charcoal leading-relaxed">
                Charities unlock tranche funding only upon proving completed real-world work. The Distribution contract autonomously releases tokens.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="p-3 bg-surface-card border border-hairline rounded-lg text-accent-blue">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-sans text-[18px] font-semibold text-ink mb-2">10x Lower Gas & Nitro Speed</h3>
              <p className="font-sans text-sm text-charcoal leading-relaxed">
                Compiled to native WASM on Arbitrum Nitro, every audit check and transfer executes with sub-second finality and near-zero gas costs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="mt-32 max-w-6xl mx-auto border-t border-hairline pt-16">
        <h2 className="font-serif text-[36px] text-ink font-normal text-center mb-12">
          Designed for Trust. Built on Arbitrum Stylus.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-lg border border-hairline bg-surface-card p-8 flex flex-col justify-between">
            <div>
              <h4 className="font-sans text-lg font-semibold text-ink mb-4">Cross-Contract Interoperability</h4>
              <p className="font-sans text-sm text-charcoal leading-relaxed">
                Clean logical separation: Treasury holds ERC-20 tokens while Distribution enforces RBAC access policies via `sol_interface!`.
              </p>
            </div>
            <span className="font-mono text-[10px] text-accent-blue mt-8">STYLUS NATIVE</span>
          </div>

          <div className="rounded-lg border border-hairline bg-surface-card p-8 flex flex-col justify-between">
            <div>
              <h4 className="font-sans text-lg font-semibold text-ink mb-4">MetaMask & EVM Wallets</h4>
              <p className="font-sans text-sm text-charcoal leading-relaxed">
                Connect seamlessly with standard EVM wallets (MetaMask, Rabby, Rainbow). Arbitrum Sepolia testnet ready.
              </p>
            </div>
            <span className="font-mono text-[10px] text-accent-orange mt-8">EVM COMPATIBLE</span>
          </div>

          <div className="rounded-lg border border-hairline bg-surface-card p-8 flex flex-col justify-between">
            <div>
              <h4 className="font-sans text-lg font-semibold text-ink mb-4">Role-Based Dashboard</h4>
              <p className="font-sans text-sm text-charcoal leading-relaxed">
                Switch profiles instantly between Donors (view metrics & donate) and Charity Admins (whitelist addresses & release milestone funds).
              </p>
            </div>
            <span className="font-mono text-[10px] text-accent-green mt-8">RBAC ENFORCED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
