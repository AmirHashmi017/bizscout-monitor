'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import type { Incident } from '@/lib/types';

const severityStyle: Record<Incident['severity'], string> = {
  low: 'bg-amber-500/15 text-amber-300 ring-amber-500/20',
  medium: 'bg-orange-500/15 text-orange-300 ring-orange-500/20',
  high: 'bg-rose-500/15 text-rose-300 ring-rose-500/20',
};

export function IncidentsTab() {
  const [items, setItems] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.incidents(1, 50);
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const socket = getSocket();
    const onNew = (doc: Incident) => setItems((prev) => [doc, ...prev]);
    socket.on('incident:new', onNew);
    return () => {
      socket.off('incident:new', onNew);
    };
  }, [load]);

  if (loading)
    return <div className="glass p-6 text-sm text-slate-400">Loading incidents…</div>;
  if (error)
    return (
      <div className="glass border-rose-500/30 p-4 text-sm text-rose-300">Error: {error}</div>
    );
  if (items.length === 0)
    return (
      <div className="glass grid place-items-center gap-1 p-10 text-center">
        <span className="text-3xl">✅</span>
        <span className="text-sm text-slate-400">No incidents detected. All systems nominal.</span>
      </div>
    );

  return (
    <div className="space-y-3">
      {items.map((inc) => (
        <div key={inc._id} className="glass animate-in p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-medium text-white">{inc.title}</h3>
            <span
              className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium uppercase ring-1 ${severityStyle[inc.severity]}`}
            >
              {inc.severity}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-slate-500">
            <span>{new Date(inc.timestamp).toLocaleString()}</span>
            <span>·</span>
            <span className="text-slate-400">
              {inc.responseTimeMs}ms vs avg {Math.round(inc.avgResponseTimeMs)}ms
            </span>
            <span>·</span>
            <span className="rounded bg-white/5 px-1.5">{inc.generatedBy}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{inc.rootCause}</p>
          {inc.recommendations.length > 0 && (
            <ul className="mt-3 space-y-1">
              {inc.recommendations.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-400">
                  <span className="text-sky-400">→</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
