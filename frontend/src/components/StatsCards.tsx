'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { RollingStats, MonitorResponse } from '@/lib/types';

interface CardProps {
  label: string;
  value: string;
  sub?: string;
  dot: string;
}

function Card({ label, value, sub, dot }: CardProps) {
  return (
    <div className="glass min-w-0 p-4 transition-transform hover:-translate-y-0.5">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
        <span className="truncate text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {label}
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
        dot="bg-sky-400"
      />
      <Card
        label="Std deviation"
        value={stats ? `${stats.stdDev} ms` : '-'}
        sub="24h window"
        dot="bg-violet-400"
      />
      <Card
        label="Samples"
        value={stats ? String(stats.count) : '-'}
        sub={`max ${stats?.max ?? '-'} ms`}
        dot="bg-emerald-400"
      />
      <Card
        label="Anomalies"
        value={String(anomalies)}
        sub="in current view"
        dot="bg-rose-400"
      />
    </div>
  );
}
