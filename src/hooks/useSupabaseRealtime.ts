'use client';

import { useEffect, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

type RealtimeTable = 'Offer' | 'Demand' | 'Match';

/**
 * Abonnement Supabase Realtime sur les tables publiques sans PII (Offer, Demand, Match).
 * Déclenche un rafraîchissement débouncé dès qu'une création, modification ou réservation survient.
 */
export function useSupabaseRealtime(
  tables: RealtimeTable[],
  onChange: () => void,
  enabled = true
) {
  const callbackRef = useRef(onChange);
  callbackRef.current = onChange;

  const tablesKey = tables.join(',');

  useEffect(() => {
    if (!enabled) return;

    const client = getSupabaseBrowserClient();
    if (!client) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        callbackRef.current();
      }, 250);
    };

    const channelName = `agrisama-realtime-${tablesKey}-${Math.random().toString(36).slice(2, 8)}`;
    let channel = client.channel(channelName);

    for (const table of tablesKey.split(',') as RealtimeTable[]) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        scheduleRefresh
      );
    }

    channel.subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      client.removeChannel(channel);
    };
  }, [tablesKey, enabled]);
}
