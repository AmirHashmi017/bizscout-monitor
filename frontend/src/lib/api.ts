import type {
  Paginated,
  MonitorResponse,
  Incident,
  RollingStats,
  ChatResult,
  CostSnapshot,
} from './types';

// Typed client for the backend REST API.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  baseUrl: API_URL,

  responses: (page: number, limit = 20, anomaliesOnly = false) =>
    getJson<Paginated<MonitorResponse>>(
      `/api/responses?page=${page}&limit=${limit}${anomaliesOnly ? '&anomaliesOnly=true' : ''}`,
    ),

  stats: () => getJson<RollingStats>('/api/responses/stats'),

  incidents: (page: number, limit = 20) =>
    getJson<Paginated<Incident>>(`/api/incidents?page=${page}&limit=${limit}`),

  cost: () => getJson<CostSnapshot>('/api/chat/cost'),

  ask: async (question: string): Promise<ChatResult> => {
    const res = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
    return res.json() as Promise<ChatResult>;
  },
};
