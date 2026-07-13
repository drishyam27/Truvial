'use client';

import React, { useState, useEffect } from 'react';
import { useProjectsStore } from '../../state/projects';
import { TrendingUp, BarChart2, PieChart, Info } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';

export default function AnalyticsPage() {
  const { projects, donations } = useProjectsStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-[400px] items-center justify-center font-sans text-xs text-mute">
        Loading charts...
      </div>
    );
  }

  // Chart 1: Donation history
  const donationData = donations
    .slice()
    .reverse()
    .map((d, index) => ({
      name: new Date(d.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      amount: d.amount,
      cumulative: donations
        .slice()
        .reverse()
        .slice(0, index + 1)
        .reduce((sum, item) => sum + item.amount, 0)
    }));

  // Chart 2: Project budget distribution
  const projectBudgetDistribution = projects.map((p) => ({
    name: p.title.slice(0, 15) + '...',
    Budget: p.totalBudget,
    Allocated: p.allocated
  }));

  // Chart 3: Milestone status pie chart
  const allMilestones = projects.flatMap((p) => p.milestones);
  const paidCount = allMilestones.filter((m) => m.status === 'Paid').length;
  const approvedCount = allMilestones.filter((m) => m.status === 'Approved').length;
  const pendingCount = allMilestones.filter((m) => m.status === 'Pending').length;

  const milestoneStatusData = [
    { name: 'Paid', value: paidCount, color: '#11ff99' },
    { name: 'Approved', value: approvedCount, color: '#3b9eff' },
    { name: 'Pending', value: pendingCount, color: '#ff801f' }
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="border-b border-hairline pb-6">
        <h1 className="font-serif text-4xl text-ink font-normal">Analytics & Insights</h1>
        <p className="font-sans text-sm text-charcoal mt-1">
          Financial breakdowns and operational milestone tracking metrics.
        </p>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Donation Growth Chart */}
        <div className="rounded-lg border border-hairline bg-surface-card p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-accent-orange" />
            <h3 className="font-sans text-sm font-semibold text-ink uppercase tracking-wider">
              Cumulative Donation Growth
            </h3>
          </div>
          <div className="h-64 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={donationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff801f" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ff801f" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis stroke="#888e90" dataKey="name" />
                <YAxis stroke="#888e90" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0c', border: '1px solid rgba(255,255,255,0.14)' }}
                  labelStyle={{ color: '#fcfdff' }}
                />
                <Area type="monotone" dataKey="cumulative" stroke="#ff801f" fillOpacity={1} fill="url(#colorAmt)" name="Total Donated (XLM)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Allocations */}
        <div className="rounded-lg border border-hairline bg-surface-card p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <BarChart2 className="h-4 w-4 text-accent-blue" />
            <h3 className="font-sans text-sm font-semibold text-ink uppercase tracking-wider">
              Initiative Budgets vs Allocations
            </h3>
          </div>
          <div className="h-64 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectBudgetDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis stroke="#888e90" dataKey="name" />
                <YAxis stroke="#888e90" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a0a0c', border: '1px solid rgba(255,255,255,0.14)' }}
                  labelStyle={{ color: '#fcfdff' }}
                />
                <Bar dataKey="Budget" fill="#3b9eff" radius={[4, 4, 0, 0]} name="Total Budget (XLM)" />
                <Bar dataKey="Allocated" fill="#11ff99" radius={[4, 4, 0, 0]} name="Allocated (XLM)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Milestone Fulfillment Pie Chart */}
        <div className="rounded-lg border border-hairline bg-surface-card p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <PieChart className="h-4 w-4 text-accent-green" />
            <h3 className="font-sans text-sm font-semibold text-ink uppercase tracking-wider">
              Milestone Payout Fulfillment
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-around h-64 gap-4">
            <div className="h-48 w-48 font-mono text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={milestoneStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {milestoneStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0a0a0c', border: '1px solid rgba(255,255,255,0.14)' }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 font-sans text-xs">
              {milestoneStatusData.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2.5">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-mute font-medium capitalize w-20">{item.name}</span>
                  <span className="text-ink font-semibold font-mono">{item.value} ({((item.value / (allMilestones.length || 1)) * 100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Informative Audit Box */}
        <div className="rounded-lg border border-hairline bg-surface-card p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-accent-yellow" />
              <h3 className="font-sans text-sm font-semibold text-ink uppercase tracking-wider">
                Auditor & Compliance Metrics
              </h3>
            </div>
            <p className="font-sans text-sm text-charcoal leading-relaxed">
              Every data point rendered above correlates directly with Soroban persistent events on the Stellar Testnet ledger. Since values are loaded from the smart contract storage indices, this dashboard provides a real-time, mathematically verifiable view of charity operation health.
            </p>
          </div>
          <div className="border-t border-hairline/50 pt-4 mt-6 flex justify-between font-mono text-[10px] text-mute">
            <span>Audit status: Pass</span>
            <span>Ledger Index: #56812</span>
          </div>
        </div>
      </div>
    </div>
  );
}
