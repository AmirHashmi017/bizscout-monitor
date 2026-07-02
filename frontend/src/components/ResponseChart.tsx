'use client';

import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Scatter,
  Area,
  ComposedChart,
} from 'recharts';
import type { MonitorResponse } from '@/lib/types';

// Response time area with anomaly markers. Presentational only.
export function ResponseChart({ items }: { items: MonitorResponse[] }) {
  const data = [...items].reverse().map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    ms: r.responseTimeMs,
    anomaly: r.isAnomaly ? r.responseTimeMs : null,
  }));

  return (
    <div className="glass animate-in p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-200">Response time</h3>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-sky-400" /> latency
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-rose-400" /> anomaly
          </span>
        </div>
      </div>
      <div className="h-60 w-full min-w-0">
        {data.length === 0 ? (
          <div className="grid h-full place-items-center text-sm text-slate-500">
            Waiting for data…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id="latency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={40} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} width={48} unit="ms" />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,23,42,0.95)',
                  border: '1px solid rgba(148,163,184,0.2)',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area
                type="monotone"
                dataKey="ms"
                stroke="#38bdf8"
                strokeWidth={2}
                fill="url(#latency)"
              />
              <Scatter dataKey="anomaly" fill="#f43f5e" shape="circle" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
