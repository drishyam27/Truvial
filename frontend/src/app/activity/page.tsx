'use client';

import React from 'react';
import { useProjectsStore } from '../../state/projects';
import { Coins, PlusCircle, CheckCircle, Award, ExternalLink, Calendar } from 'lucide-react';

export default function ActivityFeedPage() {
  const { activities } = useProjectsStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'donation':
        return <Coins className="h-4 w-4 text-accent-orange" />;
      case 'project_created':
        return <PlusCircle className="h-4 w-4 text-accent-blue" />;
      case 'milestone_approved':
        return <CheckCircle className="h-4 w-4 text-accent-yellow" />;
      case 'milestone_released':
        return <Award className="h-4 w-4 text-accent-green" />;
      default:
        return <Coins className="h-4 w-4 text-mute" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'donation':
        return 'bg-accent-orange-glow/10 border-accent-orange/20 text-accent-orange';
      case 'project_created':
        return 'bg-accent-blue-glow/10 border-accent-blue/20 text-accent-blue';
      case 'milestone_approved':
        return 'bg-accent-yellow-glow/10 border-accent-yellow/20 text-accent-yellow';
      case 'milestone_released':
        return 'bg-accent-green-glow/10 border-accent-green/20 text-accent-green';
      default:
        return 'bg-surface-elevated border-hairline text-mute';
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-hairline pb-6">
        <h1 className="font-serif text-4xl text-ink font-normal">Real-Time Activity Feed</h1>
        <p className="font-sans text-sm text-charcoal mt-1">
          Immutable audit trail of all Treasury deposits and milestone distributions.
        </p>
      </div>

      {/* Main List */}
      <div className="space-y-6">
        {activities.length === 0 ? (
          <div className="text-center py-16 border border-hairline rounded-lg bg-surface-card text-mute">
            No activities tracked yet.
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="rounded-lg border border-hairline bg-surface-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-hairline-strong"
            >
              {/* Left Side: Type Icon & Details */}
              <div className="flex items-start space-x-4">
                <div className={`p-2.5 rounded border ${getBadgeColor(activity.type)}`}>
                  {getIcon(activity.type)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-sans text-sm font-semibold text-ink">
                      {activity.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="font-mono text-[10px] text-mute">
                      ID: {activity.id}
                    </span>
                  </div>
                  <p className="font-sans text-sm text-body-text leading-relaxed">
                    {activity.details}
                  </p>
                  {activity.amount && (
                    <div className="font-mono text-xs text-mute mt-1.5">
                      Value: <span className="text-ink font-semibold">{activity.amount.toLocaleString()} XLM</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Timestamp & Ledger Link */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t border-hairline/30 md:border-none pt-3 md:pt-0 gap-2">
                <div className="flex items-center text-xs text-mute font-mono">
                  <Calendar className="mr-1 h-3.5 w-3.5" />
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </div>
                {activity.hash && (
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${activity.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 font-mono text-[11px] text-accent-blue hover:underline mt-1"
                  >
                    <span>{activity.hash.slice(0, 10)}...</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
