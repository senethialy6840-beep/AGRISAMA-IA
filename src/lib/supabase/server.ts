import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_MEDIA_BUCKET = 'agrisama-media';

let serverClient: SupabaseClient | null = null;

/**
 * Client Supabase serveur strictement privé (SUPABASE_SERVICE_ROLE_KEY).
 * Ne jamais importer depuis un composant client.
 */
export function getSupabaseServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    throw new Error('Configuration Supabase serveur manquante (URL ou clé secrète).');
  }

  if (!serverClient) {
    serverClient = createClient(url, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return serverClient;
}
