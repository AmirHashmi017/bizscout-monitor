'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { CostSnapshot } from '@/lib/types';

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-200">{value}</span>
    </span>
  );
}

export function CostBadge({ refreshKey }: { refreshKey: number }) {
  const [cost, setCost] = useState<CostSnapshot | null>(null);

  useEffect(() => {
    const fetchCost = () => api.cost().then(setCost).catch(() => setCost(null));
    void fetchCost();
    const id = setInterval(fetchCost, 15_000);
    return () => clearInterval(id);
  }, [refreshKey]);

  if (!cost) return null;

  const pct = cost.maxCallsPerHour
    ? (cost.remainingCalls / cost.maxCallsPerHour) * 100
    : 0;

  return (
    <div className="glass flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 text-xs">
      <span className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${cost.enabled ? 'bg-emerald-400' : 'bg-slate-600'}`}
        />
        <span className="font-medium text-slate-200">
          AI {cost.enabled ? 'enabled' : 'disabled'}
        </span>
        <span className="rounded bg-white/5 px-1.5 py-0.5 text-slate-400">{cost.model}</span>
      </span>

      <span className="flex items-center gap-2">
        <span className="text-slate-500">Hourly quota</span>
        <span className="h-1.5 w-20 overflow-hidden rounded-full bg-white/5">
          <span
            className="block h-full rounded-full bg-sky-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </span>
        <span className="font-medium text-slate-200">
          {cost.remainingCalls}/{cost.maxCallsPerHour}
        </span>
      </span>

      <Stat label="Calls" value={`${cost.totalCalls} (${cost.cachedHits} cached)`} />
      <Stat label="Est. cost" value={`$${cost.totalCostUsd.toFixed(4)}`} />
    </div>
  );
}
