'use client';

import type { MonitorResponse } from '@/lib/types';

function StatusPill({ code, success }: { code: number; success: boolean }) {
  const color = success
    ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/20'
    : 'bg-rose-500/15 text-rose-300 ring-rose-500/20';
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${color}`}>
      {code || 'ERR'}
    </span>
  );
}

function Bar({ ms }: { ms: number }) {
  // Visual latency bar, capped at 2000ms for scale.
  const pct = Math.min(100, (ms / 2000) * 100);
  const color = ms > 1000 ? 'bg-rose-400' : ms > 500 ? 'bg-amber-400' : 'bg-sky-400';
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 font-mono text-xs tabular-nums text-slate-200">{ms} ms</span>
      <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-white/5 sm:block">
        <span className={`block h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

/**
 * Tabular view of monitoring responses (core requirement). Responsive: the
 * table scrolls horizontally on small screens rather than overflowing.
 */
export function ResponseTable({ items }: { items: MonitorResponse[] }) {
  if (items.length === 0) {
    return (
      <div className="glass grid place-items-center p-8 text-sm text-slate-500">
        No responses yet — the first ping lands shortly.
      </div>
    );
  }

  return (
    <div className="glass animate-in overflow-hidden">
      <div className="max-h-[460px] overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur">
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400">
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Latency</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Flag</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr
                key={r._id}
                className={`border-t border-white/5 transition-colors hover:bg-white/[0.03] ${
                  r.isAnomaly ? 'bg-rose-500/[0.06]' : ''
                }`}
              >
                <td className="whitespace-nowrap px-4 py-2.5 text-slate-300">
                  {new Date(r.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-4 py-2.5">
                  <StatusPill code={r.statusCode} success={r.success} />
                </td>
                <td className="px-4 py-2.5">
                  <Bar ms={r.responseTimeMs} />
                </td>
                <td className="px-4 py-2.5 text-slate-400">{r.responseSizeBytes} B</td>
                <td className="px-4 py-2.5">
                  {r.isAnomaly ? (
                    <span className="inline-flex items-center gap-1 text-rose-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> anomaly
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
