'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  source?: string;
}

const SUGGESTIONS = [
  'What were the slowest response times today?',
  'Summarize any issues in the last 24 hours',
  'How many anomalies occurred recently?',
];

export function ChatWidget({ onCall }: { onCall: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (question: string) => {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    try {
      const result = await api.ask(question);
      setMessages((m) => [...m, { role: 'assistant', text: result.answer, source: result.source }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'Failed to reach the assistant. Please try again.' },
      ]);
    } finally {
      setLoading(false);
      onCall();
    }
  };

  return (
    <div className="glass flex h-full min-h-[420px] flex-col">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-sky-500/30 to-violet-500/30 text-sm">
          ✨
        </span>
        <div>
          <div className="text-sm font-medium text-white">Ask the data</div>
          <div className="text-[11px] text-slate-500">Powered by Gemini · grounded in your metrics</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">Try asking:</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => void send(s)}
                className="block w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:border-sky-500/40 hover:bg-sky-500/[0.06]"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex animate-in ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'rounded-br-sm bg-sky-600 text-white'
                  : 'rounded-bl-sm border border-white/10 bg-white/[0.04] text-slate-200'
              }`}
            >
              {m.text}
              {m.source && m.source !== 'llm' && (
                <span className="ml-2 text-[11px] text-slate-400">· {m.source}</span>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex gap-2 border-t border-white/10 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your monitoring data…"
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-sky-500/50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-500 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
