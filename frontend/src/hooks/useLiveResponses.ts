'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import type { MonitorResponse } from '@/lib/types';

interface State {
  items: MonitorResponse[];
  loading: boolean;
  error: string | null;
  connected: boolean;
}

const MAX_ROWS = 100;

// Load the first page over REST, then keep the list live via Socket.IO.
// Tracks loading, error, and connection state for the UI.
export function useLiveResponses() {
  const [state, setState] = useState<State>({
    items: [],
    loading: true,
    error: null,
    connected: false,
  });

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api.responses(1, 30);
      setState((s) => ({ ...s, items: data.items, loading: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load data',
      }));
    }
  }, []);

  useEffect(() => {
    void reload();

    const socket = getSocket();
    const onConnect = () => setState((s) => ({ ...s, connected: true }));
    const onDisconnect = () => setState((s) => ({ ...s, connected: false }));
    const onNew = (doc: MonitorResponse) =>
      setState((s) => ({ ...s, items: [doc, ...s.items].slice(0, MAX_ROWS) }));

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('response:new', onNew);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('response:new', onNew);
    };
  }, [reload]);

  return { ...state, reload };
}
