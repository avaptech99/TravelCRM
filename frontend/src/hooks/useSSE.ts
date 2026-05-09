import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export type SSEMode = 'connecting' | 'connected' | 'polling' | 'disabled';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const MAX_FAILURES  = 3;    // fall back to polling after 3 consecutive failures
const RECONNECT_MAX = 8000; // max jitter delay before reconnect attempt (8s)
const POLL_INTERVAL = 20000; // fallback poll interval (matches your current 20s)

export function useSSE(token: string | null) {
  const queryClient   = useQueryClient();
  const esRef         = useRef<EventSource | null>(null);
  const failCount     = useRef(0);
  const reconnectRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mode, setMode] = useState<SSEMode>('connecting');

  // ── Polling fallback ──────────────────────────────────────────────────────
  const startPolling = useCallback(() => {
    setMode('polling');
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      // Invalidate — React Query will refetch on next render
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }, POLL_INTERVAL);
    console.log('[SSE] Falling back to polling every', POLL_INTERVAL / 1000 + 's');
  }, [queryClient]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ── SSE event handler ─────────────────────────────────────────────────────
  const handleEvent = useCallback((type: string, rawData: string) => {
    try {
      const data = JSON.parse(rawData);

      switch (type) {
        case 'connected':
          // Connection confirmed
          break;

        case 'heartbeat':
          // Keep-alive — no action needed
          break;

        case 'booking_created':
          // New booking appeared — invalidate list, don't patch (don't know position)
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          queryClient.invalidateQueries({ queryKey: ['bookingStats'] });
          break;

        case 'booking_updated':
          // Patch single booking in cache — no full refetch needed
          queryClient.setQueryData(
            ['booking', data.bookingId],
            (old: any) => old ? { ...old, ...data.changes } : old
          );
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          break;

        case 'status_changed':
          // Patch status in both list and detail caches
          queryClient.setQueryData(
            ['booking', data.bookingId],
            (old: any) => old ? {
              ...old,
              status: data.status,
              lastInteractionAt: data.lastInteractionAt,
            } : old
          );
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          break;

        case 'booking_deleted':
          // Remove from list — filter it out
          queryClient.setQueryData(
            ['bookings'],
            (old: any) => {
              if (!old?.bookings) return old;
              return {
                ...old,
                bookings: old.bookings.filter(
                  (b: any) => b._id !== data.bookingId
                ),
                total: (old.total || 1) - 1,
              };
            }
          );
          // Invalidate detail if open
          queryClient.removeQueries({ queryKey: ['booking', data.bookingId] });
          break;

        case 'booking_assigned':
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          break;

        case 'payment_added':
        case 'payment_deleted':
          // Refetch the specific booking to get updated outstanding amount
          queryClient.invalidateQueries({ queryKey: ['booking', data.bookingId] });
          break;

        case 'passenger_added':
        case 'comment_added':
        case 'booking_verified':
          queryClient.invalidateQueries({ queryKey: ['booking', data.bookingId] });
          break;

        case 'notification_new':
          // Prepend notification — instant, no refetch
          queryClient.setQueryData(
            ['notifications'],
            (old: any[]) => old ? [data, ...old] : [data]
          );
          break;

        case 'analytics_stale':
          // Don't auto-refetch (expensive) — invalidate so next view triggers fetch
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
          break;

        case 'shutdown':
          // Server shutting down — will reconnect automatically
          console.log('[SSE] Server shutdown signal received');
          break;

        case 'replaced':
          // This connection was replaced by a new tab — don't reconnect
          console.log('[SSE] Connection replaced by new tab');
          setMode('disabled');
          break;
      }
    } catch (err) {
      console.error('[SSE] Failed to parse event data:', err);
    }
  }, [queryClient]);

  // ── Connect ───────────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!token) return;
    if (mode === 'disabled') return;

    // Clean up any existing connection
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const url = `${API_BASE}/stream?token=${encodeURIComponent(token)}`;
    const es  = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      failCount.current = 0;
      stopPolling();
      setMode('connected');
      console.log('[SSE] Connected');
    };

    // Listen to all custom event types
    const eventTypes: string[] = [
      'connected', 'heartbeat', 'booking_created', 'booking_updated',
      'booking_deleted', 'status_changed', 'booking_assigned',
      'payment_added', 'payment_deleted', 'passenger_added',
      'comment_added', 'booking_verified', 'notification_new',
      'analytics_stale', 'shutdown', 'replaced',
    ];

    eventTypes.forEach(type => {
      es.addEventListener(type, (e: MessageEvent) => handleEvent(type, e.data));
    });

    es.onerror = () => {
      failCount.current++;
      console.warn(`[SSE] Error (failure ${failCount.current}/${MAX_FAILURES})`);

      if (failCount.current >= MAX_FAILURES) {
        // SSE not working — fall back to polling
        es.close();
        esRef.current = null;
        startPolling();

        // Keep silently retrying SSE in background every 2 minutes
        reconnectRef.current = setTimeout(() => {
          failCount.current = 0;
          connect();
        }, 120_000);
      } else {
        // Jitter reconnect — prevents all 20 users reconnecting simultaneously
        // after a server restart. Spreads reconnects over 1–8 seconds.
        const jitter = Math.random() * RECONNECT_MAX + 1000;
        console.log(`[SSE] Reconnecting in ${Math.round(jitter)}ms`);
        es.close();
        esRef.current = null;
        reconnectRef.current = setTimeout(connect, jitter);
      }
    };
  }, [token, handleEvent, startPolling, stopPolling, mode]);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (token) connect();

    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      stopPolling();
      esRef.current?.close();
    };
  }, [token]); // only reconnect when token changes (login/logout)

  return { mode };
}
