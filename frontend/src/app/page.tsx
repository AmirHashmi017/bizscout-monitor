'use client';

import { useState } from 'react';
import { useLiveResponses } from '@/hooks/useLiveResponses';
import { StatsCards } from '@/components/StatsCards';
import { ResponseChart } from '@/components/ResponseChart';
import { ResponseTable } from '@/components/ResponseTable';
import { IncidentsTab } from '@/components/IncidentsTab';
import { ChatWidget } from '@/components/ChatWidget';
import { CostBadge } from '@/components/CostBadge';

type Tab = 'live' | 'incidents';

// Dashboard page. Live data and incidents tabs, plus the AI chat panel.
export default function Dashboard() {
  const { items, loading, error, connected, reload } = useLiveResponses();
  const [tab, setTab] = useState<Tab>('live');
  const [costRefresh, setCostRefresh] = useState(0);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-600 text-lg shadow-lg shadow-sky-500/20">
            📡
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">BizScout Monitor</h1>
            <p className="text-sm text-slate-400">
              Live HTTP monitoring of httpbin.org · pings every 5 min
            </p>
          </div>
        </div>
        <div className="glass flex items-center gap-2 px-3 py-1.5 text-xs">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? 'live-dot bg-emerald-400' : 'bg-slate-600'
            }`}
          />
          <span className={connected ? 'text-emerald-300' : 'text-slate-400'}>
            {connected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </header>

      <div className="mb-6">
        <CostBadge refreshKey={costRefresh} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <section className="space-y-5 lg:col-span-2">
          <StatsCards latest={items} />

          {/* Tabs */}
          <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {(['live', 'incidents'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                  tab === t ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'live' ? 'Live data' : 'Incidents'}
              </button>
            ))}
          </div>

          {tab === 'live' ? (
            <div className="space-y-5">
              <ResponseChart items={items} />
              {loading && (
                <div className="glass p-6 text-sm text-slate-400">Loading data…</div>
              )}
              {error && (
                <div className="glass flex items-center justify-between border-rose-500/30 px-4 py-3 text-sm text-rose-300">
                  <span>Error: {error}</span>
                  <button
                    onClick={() => void reload()}
                    className="rounded-lg bg-rose-500/20 px-3 py-1 font-medium hover:bg-rose-500/30"
                  >
                    Retry
                  </button>
                </div>
              )}
              {!loading && !error && <ResponseTable items={items} />}
            </div>
          ) : (
            <IncidentsTab />
          )}
        </section>

        {/* Chat column — sticky on desktop */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <ChatWidget onCall={() => setCostRefresh((n) => n + 1)} />
          </div>
        </aside>
      </div>

      <footer className="mt-10 text-center text-xs text-slate-600">
        BizScout Monitor · TypeScript + Express · Next.js · MongoDB · Gemini
      </footer>
    </main>
  );
}
