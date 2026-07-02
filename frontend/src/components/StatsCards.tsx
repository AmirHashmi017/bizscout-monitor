'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { RollingStats, MonitorResponse } from '@/lib/types';

interface CardProps {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  icon: React.ReactNode;
}

function Card({ label, value, sub, accent, icon }: CardProps) {
  return (
    <div className="glass group animate-in min-w-0 p-4 transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${accent}`}>
          {icon}
        </span>
      </div>
      <div className="mt-2 truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">
        {value}
      </div>
      {sub && <div className="truncate text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

// Summary metric cards. Refreshes on each new live response.
export function StatsCards({ latest }: { latest: MonitorResponse[] }) {
  const [stats, setStats] = useState<RollingStats | null>(null);

  useEffect(() => {
    api
      .stats()
      .then(setStats)
      .catch(() => setStats(null));
  }, [latest.length]);

  const anomalies = latest.filter((r) => r.isAnomaly).length;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card
        label="Mean latency"
        value={stats ? `${stats.mean} ms` : '-'}
        sub={`p95 ${stats?.p95 ?? '-'} ms`}
        accent="bg-sky-500/15 text-sky-300"
        icon={<span className="text-sm">⚡</span>}
      />
      <Card
        label="Std deviation"
        value={stats ? `${stats.stdDev} ms` : '-'}
        sub="24h window"
        accent="bg-violet-500/15 text-violet-300"
        icon={<span className="text-sm">📊</span>}
      />
      <Card
        label="Samples"
        value={stats ? String(stats.count) : '-'}
        sub={`max ${stats?.max ?? '-'} ms`}
        accent="bg-emerald-500/15 text-emerald-300"
        icon={<span className="text-sm">🎯</span>}
      />
      <Card
        label="Anomalies"
        value={String(anomalies)}
        sub="in current view"
        accent="bg-rose-500/15 text-rose-300"
        icon={<span className="text-sm">🚨</span>}
      />
    </div>
  );
}
