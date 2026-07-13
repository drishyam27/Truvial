'use client';

import React, { useState } from 'react';
import { useWalletStore } from '../../state/wallet';
import { useProjectsStore, Project, Milestone } from '../../state/projects';
import { StellarService } from '../../services/stellar';
import { Wallet, Shield, PlusCircle, Check, Award, ArrowUpRight, Coins, ListTodo } from 'lucide-react';

export default function DashboardPage() {
  const { isConnected, publicKey, userRole, balance } = useWalletStore();
  const { projects, totalTreasuryBalance } = useProjectsStore();

  // Donor states
  const [donateAmount, setDonateAmount] = useState('');
  const [isDonating, setIsDonating] = useState(false);

  // Admin states
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjBeneficiary, setNewProjBeneficiary] = useState('');
  const [newProjBudget, setNewProjBudget] = useState('');
  const [isAdminCreating, setIsAdminCreating] = useState(false);

  const [whitelistAddress, setWhitelistAddress] = useState('');
  const [isWhitelisting, setIsWhitelisting] = useState(false);

  // Milestone management state
  const [selectedProject, setSelectedProject] = useState<Project | null>(projects[0] || null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneAmount, setNewMilestoneAmount] = useState('');
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  // Status message
  const [statusMessage, setStatusMessage] = useState('');

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donateAmount || isNaN(Number(donateAmount))) return;
    setIsDonating(true);
    setStatusMessage('');
    try {
      await StellarService.donate(Number(donateAmount));
      setDonateAmount('');
      setStatusMessage('Donation successfully processed!');
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsDonating(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle || !newProjBeneficiary || !newProjBudget) return;
    setIsAdminCreating(true);
    setStatusMessage('');
    try {
      // Whitelist beneficiary first automatically in mock mode for UX flow
      useProjectsStore.getState().addActivity({
        type: 'beneficiary_added',
        details: `Beneficiary ${newProjBeneficiary.slice(0, 8)}... whitelisted by Admin.`
      });
      
      await StellarService.createProject(
        newProjTitle,
        newProjDesc,
        newProjBeneficiary,
        Number(newProjBudget)
      );
      setNewProjTitle('');
      setNewProjDesc('');
      setNewProjBeneficiary('');
      setNewProjBudget('');
      setStatusMessage('Project successfully created!');
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsAdminCreating(false);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newMilestoneTitle || !newMilestoneAmount) return;
    setIsAddingMilestone(true);
    try {
      useProjectsStore.getState().addMilestone(
        selectedProject.id,
        newMilestoneTitle,
        Number(newMilestoneAmount)
      );
      useProjectsStore.getState().addActivity({
        type: 'milestone_approved',
        details: `New milestone "${newMilestoneTitle}" added to project "${selectedProject.title}" with amount ${Number(newMilestoneAmount).toLocaleString()} XLM.`,
        amount: Number(newMilestoneAmount)
      });
      // Refresh local selection
      const updated = useProjectsStore.getState().projects.find(p => p.id === selectedProject.id);
      if (updated) setSelectedProject(updated);
      
      setNewMilestoneTitle('');
      setNewMilestoneAmount('');
      setStatusMessage('Milestone added successfully!');
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsAddingMilestone(false);
    }
  };

  const handleApproveMilestone = async (projId: number, mId: number) => {
    try {
      await StellarService.approveMilestone(projId, mId);
      setStatusMessage('Milestone approved! Ready for payout.');
      if (selectedProject) {
        const updated = useProjectsStore.getState().projects.find(p => p.id === selectedProject.id);
        if (updated) setSelectedProject(updated);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReleaseFunds = async (projId: number, mId: number) => {
    try {
      await StellarService.releaseMilestoneFunds(projId, mId);
      setStatusMessage('Funds successfully released to beneficiary!');
      if (selectedProject) {
        const updated = useProjectsStore.getState().projects.find(p => p.id === selectedProject.id);
        if (updated) setSelectedProject(updated);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
        <div className="p-4 bg-surface-card border border-hairline rounded-full mb-6">
          <Wallet className="h-10 w-10 text-mute" />
        </div>
        <h2 className="font-serif text-3xl text-ink font-normal mb-4">Connect Wallet Profile</h2>
        <p className="font-sans text-sm text-charcoal mb-8 leading-relaxed">
          Please select a wallet profile from the navbar header to access the Truvial Charity Dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-hairline pb-6 gap-4">
        <div>
          <h1 className="font-serif text-4xl text-ink font-normal">Truvial Dashboard</h1>
          <p className="font-sans text-sm text-charcoal mt-1">Logged in as {userRole.toUpperCase()}</p>
        </div>
        {statusMessage && (
          <div className="rounded border border-hairline bg-surface-card px-4 py-2 text-xs font-mono text-accent-green">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-lg border border-hairline bg-surface-card p-6">
          <div className="flex justify-between items-center text-mute font-sans text-xs uppercase tracking-wider mb-3">
            <span>Treasury Pool</span>
            <Coins className="h-4 w-4 text-accent-orange" />
          </div>
          <div className="font-serif text-3xl text-ink">{totalTreasuryBalance.toLocaleString()} XLM</div>
          <span className="text-[11px] text-charcoal font-sans">Locked in Treasury Smart Contract</span>
        </div>

        <div className="rounded-lg border border-hairline bg-surface-card p-6">
          <div className="flex justify-between items-center text-mute font-sans text-xs uppercase tracking-wider mb-3">
            <span>Personal Balance</span>
            <Wallet className="h-4 w-4 text-accent-blue" />
          </div>
          <div className="font-serif text-3xl text-ink">{parseFloat(balance).toLocaleString()} XLM</div>
          <span className="text-[11px] text-charcoal font-sans truncate block">{publicKey}</span>
        </div>

        <div className="rounded-lg border border-hairline bg-surface-card p-6">
          <div className="flex justify-between items-center text-mute font-sans text-xs uppercase tracking-wider mb-3">
            <span>Active Projects</span>
            <ListTodo className="h-4 w-4 text-accent-green" />
          </div>
          <div className="font-serif text-3xl text-ink">{projects.length}</div>
          <span className="text-[11px] text-charcoal font-sans">Milestone-linked contracts</span>
        </div>
      </div>

      {/* Main Content Split based on Role */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Projects Board */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-serif text-2xl text-ink font-normal">Active Initiatives</h2>
          
          <div className="space-y-4">
            {projects.map((project) => (
              <div 
                key={project.id} 
                className={`rounded-lg border p-6 transition-all cursor-pointer ${
                  selectedProject?.id === project.id 
                    ? 'border-hairline-strong bg-surface-elevated' 
                    : 'border-hairline bg-surface-card hover:bg-surface-elevated/50'
                }`}
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-sans text-lg font-semibold text-ink">{project.title}</h3>
                  <span className="font-mono text-xs text-mute bg-canvas px-2.5 py-1 rounded border border-hairline">
                    Budget: {project.totalBudget.toLocaleString()} XLM
                  </span>
                </div>
                <p className="font-sans text-sm text-charcoal leading-relaxed mb-4">{project.description}</p>
                <div className="flex justify-between items-center text-xs font-mono text-mute border-t border-hairline/50 pt-4">
                  <span>Beneficiary: {project.beneficiary.slice(0, 12)}...</span>
                  <span>Milestones: {project.milestones.length}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Dynamic Controls (Donor vs Admin vs Beneficiary) */}
        <div className="space-y-8">
          
          {/* DONOR PANEL */}
          {userRole === 'donor' && (
            <div className="rounded-lg border border-hairline bg-surface-card p-6 space-y-6">
              <h3 className="font-serif text-xl text-ink font-normal">Contribute Funds</h3>
              <p className="font-sans text-xs text-charcoal">
                Provide secure donations directly into the Truvial Treasury. Funds remain locked until charity admins unlock milestones.
              </p>
              <form onSubmit={handleDonate} className="space-y-4">
                <div>
                  <label className="block text-xs text-mute font-sans font-semibold uppercase tracking-wider mb-2">
                    Amount (XLM)
                  </label>
                  <input
                    type="number"
                    value={donateAmount}
                    onChange={(e) => setDonateAmount(e.target.value)}
                    placeholder="e.g. 100"
                    disabled={isDonating}
                    required
                    className="w-full h-10 rounded border border-hairline-strong bg-canvas px-4 font-mono text-sm text-ink focus:outline-none focus:border-ink"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isDonating}
                  className="w-full h-10 flex items-center justify-center rounded bg-primary-white font-sans text-xs font-bold text-primary-on transition-colors hover:bg-white/90 disabled:opacity-50"
                >
                  {isDonating ? 'Signing Transaction...' : 'Donate Funds'}
                </button>
              </form>
            </div>
          )}

          {/* ADMIN PANELS */}
          {userRole === 'admin' && (
            <div className="space-y-8">
              {/* Project Creator */}
              <div className="rounded-lg border border-hairline bg-surface-card p-6 space-y-6">
                <h3 className="font-serif text-xl text-ink font-normal">Launch Initiative</h3>
                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div>
                    <label className="block text-xs text-mute font-sans uppercase mb-1.5">Project Title</label>
                    <input
                      type="text"
                      value={newProjTitle}
                      onChange={(e) => setNewProjTitle(e.target.value)}
                      placeholder="e.g. Solar Upgrades"
                      className="w-full h-9 rounded border border-hairline-strong bg-canvas px-3 text-xs text-ink focus:outline-none focus:border-ink"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-mute font-sans uppercase mb-1.5">Description</label>
                    <textarea
                      value={newProjDesc}
                      onChange={(e) => setNewProjDesc(e.target.value)}
                      placeholder="Project details..."
                      rows={3}
                      className="w-full p-3 rounded border border-hairline-strong bg-canvas text-xs text-ink focus:outline-none focus:border-ink resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-mute font-sans uppercase mb-1.5">Beneficiary PublicKey</label>
                    <input
                      type="text"
                      value={newProjBeneficiary}
                      onChange={(e) => setNewProjBeneficiary(e.target.value)}
                      placeholder="GDW..."
                      className="w-full h-9 rounded border border-hairline-strong bg-canvas px-3 text-xs text-ink focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-mute font-sans uppercase mb-1.5">Total Budget (XLM)</label>
                    <input
                      type="number"
                      value={newProjBudget}
                      onChange={(e) => setNewProjBudget(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full h-9 rounded border border-hairline-strong bg-canvas px-3 text-xs text-ink focus:outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-9 flex items-center justify-center rounded bg-primary-white text-xs font-bold text-primary-on hover:bg-white/90"
                  >
                    Create Project
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* BENEFICIARY PANEL */}
          {userRole === 'beneficiary' && (
            <div className="rounded-lg border border-hairline bg-surface-card p-6 space-y-6">
              <h3 className="font-serif text-xl text-ink font-normal">Beneficiary Portal</h3>
              <p className="font-sans text-xs text-charcoal">
                You are registered as a receiver of milestone payouts. Coordinate with admins to approve milestones and release locked funds.
              </p>
              <div className="rounded border border-hairline bg-surface-elevated p-4">
                <span className="text-[10px] text-mute uppercase font-mono block mb-1">Your Key</span>
                <span className="text-xs text-ink font-mono break-all">{publicKey}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Project Milestone Detail Board */}
      {selectedProject && (
        <div className="border-t border-hairline pt-12 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-mono text-[10px] uppercase text-accent-orange tracking-widest">Active Project Milestones</span>
              <h2 className="font-serif text-2xl text-ink font-normal">{selectedProject.title} Board</h2>
            </div>
            {userRole === 'admin' && (
              <form onSubmit={handleAddMilestone} className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Milestone title"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  className="h-8 rounded border border-hairline-strong bg-surface-card px-3 text-xs text-ink focus:outline-none"
                  required
                />
                <input
                  type="number"
                  placeholder="Amount (XLM)"
                  value={newMilestoneAmount}
                  onChange={(e) => setNewMilestoneAmount(e.target.value)}
                  className="h-8 w-24 rounded border border-hairline-strong bg-surface-card px-3 text-xs text-ink focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="h-8 rounded bg-primary-white px-4 font-sans text-xs font-semibold text-primary-on hover:bg-white/95 flex items-center space-x-1"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </form>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {selectedProject.milestones.map((milestone) => (
              <div 
                key={milestone.id} 
                className="rounded-lg border border-hairline bg-surface-card p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs text-mute">Milestone #{milestone.id}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono border ${
                      milestone.status === 'Paid' 
                        ? 'bg-accent-green-glow/10 border-accent-green/20 text-accent-green' 
                        : milestone.status === 'Approved' 
                        ? 'bg-accent-blue-glow/10 border-accent-blue/20 text-accent-blue' 
                        : 'bg-surface-elevated border-hairline text-mute'
                    }`}>
                      {milestone.status}
                    </span>
                  </div>
                  <h4 className="font-sans text-[15px] font-semibold text-ink mb-2">{milestone.title}</h4>
                  <p className="font-serif text-lg text-ink font-normal">{milestone.amount.toLocaleString()} XLM</p>
                </div>

                {/* Admin Actions */}
                {userRole === 'admin' && (
                  <div className="border-t border-hairline/50 pt-4 mt-6">
                    {milestone.status === 'Pending' && (
                      <button
                        onClick={() => handleApproveMilestone(selectedProject.id, milestone.id)}
                        className="w-full h-8 flex items-center justify-center rounded border border-accent-blue/30 bg-accent-blue-glow/5 hover:bg-accent-blue-glow/10 text-xs font-semibold text-accent-blue transition-colors"
                      >
                        Approve Milestone
                      </button>
                    )}
                    {milestone.status === 'Approved' && (
                      <button
                        onClick={() => handleReleaseFunds(selectedProject.id, milestone.id)}
                        className="w-full h-8 flex items-center justify-center rounded border border-accent-green/30 bg-accent-green-glow/5 hover:bg-accent-green-glow/10 text-xs font-semibold text-accent-green transition-colors"
                      >
                        Release Funds
                      </button>
                    )}
                    {milestone.status === 'Paid' && (
                      <div className="flex items-center justify-center space-x-1.5 py-1 text-xs text-mute font-mono">
                        <Check className="h-4 w-4 text-accent-green" />
                        <span>Transferred</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
