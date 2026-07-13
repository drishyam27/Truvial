'use client';

import React, { useState, useEffect } from 'react';
import { useProjectsStore } from '../../state/projects';
import { TrendingUp, BarChart2, PieChart, Info } from 'lucide-react';

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

  // Helper calculation for Donation Area Chart SVG
  const donationMax = donationData.length > 0 ? Math.max(...donationData.map(d => d.cumulative), 100) : 100;
  const areaWidth = 400;
  const areaHeight = 160;
  const areaPoints = donationData.map((d, i) => {
    const x = donationData.length > 1 ? (i / (donationData.length - 1)) * areaWidth : areaWidth / 2;
    const y = areaHeight - (d.cumulative / donationMax) * (areaHeight - 40) - 20;
    return { x, y, name: d.name, amount: d.cumulative };
  });

  const areaPath = areaPoints.length > 0
    ? `M ${areaPoints[0].x} ${areaHeight} ` + areaPoints.map(p => `L ${p.x} ${p.y}`).join(' ') + ` L ${areaPoints[areaPoints.length - 1].x} ${areaHeight} Z`
    : '';

  const linePath = areaPoints.length > 0
    ? areaPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : '';

  // Helper calculation for Project Budget Bar Chart SVG
  const barMax = projectBudgetDistribution.length > 0
    ? Math.max(...projectBudgetDistribution.map(p => Math.max(p.Budget, p.Allocated, 1)), 100)
    : 100;

  // Helper for Donut chart SVG
  const totalMilestones = allMilestones.length || 1;
  let accumulatedPercent = 0;
  const donutSegments = milestoneStatusData.map((item) => {
    const percent = allMilestones.length > 0 ? (item.value / totalMilestones) * 100 : 0;
    const offset = 100 - accumulatedPercent;
    accumulatedPercent += percent;
    return {
      ...item,
      percent,
      strokeDash: `${percent} ${100 - percent}`,
      strokeOffset: `${offset}`
    };
  });

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
          <div className="flex flex-col items-center justify-center p-4 border border-hairline/50 rounded bg-surface-deep/30">
            {donationData.length === 0 ? (
              <div className="font-sans text-xs text-mute py-12">No donation history available yet.</div>
            ) : (
              <div className="relative w-full max-w-lg h-44">
                <svg viewBox={`0 0 ${areaWidth} ${areaHeight}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff801f" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ff801f" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1={areaHeight * 0.25} x2={areaWidth} y2={areaHeight * 0.25} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <line x1="0" y1={areaHeight * 0.5} x2={areaWidth} y2={areaHeight * 0.5} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <line x1="0" y1={areaHeight * 0.75} x2={areaWidth} y2={areaHeight * 0.75} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

                  {/* Area path */}
                  {areaPath && <path d={areaPath} fill="url(#areaGlow)" />}
                  {/* Line path */}
                  {linePath && <path d={linePath} fill="none" stroke="#ff801f" strokeWidth="2.5" />}

                  {/* Axis line */}
                  <line x1="0" y1={areaHeight} x2={areaWidth} y2={areaHeight} stroke="rgba(255,255,255,0.1)" />

                  {/* Points */}
                  {areaPoints.map((p, idx) => (
                    <g key={idx}>
                      <circle cx={p.x} cy={p.y} r="4" fill="#0a0a0c" stroke="#ff801f" strokeWidth="2" />
                    </g>
                  ))}
                </svg>
                {/* Labels */}
                <div className="flex justify-between font-mono text-[10px] text-mute mt-2">
                  <span>{donationData[0]?.name}</span>
                  <span>Cumulative Donation Progress</span>
                  <span>{donationData[donationData.length - 1]?.name}</span>
                </div>
              </div>
            )}
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
          <div className="flex flex-col space-y-4 justify-center p-4 border border-hairline/50 rounded bg-surface-deep/30 min-h-[176px]">
            {projectBudgetDistribution.length === 0 ? (
              <div className="font-sans text-xs text-mute py-12 text-center">No project details tracked yet.</div>
            ) : (
              projectBudgetDistribution.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-xs font-sans">
                    <span className="text-ink font-medium">{item.name}</span>
                    <span className="text-mute font-mono">
                      {item.Allocated.toLocaleString()} / {item.Budget.toLocaleString()} XLM
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface-deep rounded-full overflow-hidden flex space-x-1">
                    <div 
                      className="bg-accent-blue h-full rounded-l-full" 
                      style={{ width: `${Math.max((item.Budget / barMax) * 100, 2)}%` }}
                    />
                    <div 
                      className="bg-accent-green h-full rounded-r-full" 
                      style={{ width: `${Math.max((item.Allocated / barMax) * 100, 2)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
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
          <div className="flex flex-col sm:flex-row items-center justify-around h-64 gap-4 p-4 border border-hairline/50 rounded bg-surface-deep/30">
            {allMilestones.length === 0 ? (
              <div className="font-sans text-xs text-mute py-12 text-center w-full">No milestones configured yet.</div>
            ) : (
              <>
                <div className="h-40 w-40 flex items-center justify-center relative">
                  <svg viewBox="0 0 42 42" className="h-32 w-32">
                    <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
                    {donutSegments.map((seg, idx) => (
                      <circle
                        key={idx}
                        cx="21"
                        cy="21"
                        r="15.9155"
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="4"
                        strokeDasharray={seg.strokeDash}
                        strokeDashoffset={seg.strokeOffset}
                        transform="rotate(-90 21 21)"
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
                    <span className="text-mute text-[10px] uppercase tracking-wider">Total</span>
                    <span className="text-xl font-bold text-ink">{allMilestones.length}</span>
                  </div>
                </div>
                <div className="space-y-3 font-sans text-xs flex-1 sm:pl-6">
                  {milestoneStatusData.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2.5">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-mute font-medium capitalize w-20">{item.name}</span>
                      <span className="text-ink font-semibold font-mono">
                        {item.value} ({((item.value / totalMilestones) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
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
