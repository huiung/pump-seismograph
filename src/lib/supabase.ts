import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('Supabase env vars missing — database features disabled');
    return null;
  }

  supabase = createClient(url, key);
  return supabase;
}

export async function insertToken(token: {
  name: string;
  symbol: string;
  mint_address: string;
  category: string;
  trade_amount: number;
  timestamp: string;
}) {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client.from('tokens').insert(token).select();
  if (error) {
    console.error('insertToken error:', error.message);
    return null;
  }
  return data;
}

export async function getTokensByTheme(theme: string, limit = 50) {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from('tokens')
    .select('*')
    .eq('category', theme)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getTokensByTheme error:', error.message);
    return [];
  }
  return data ?? [];
}

export async function getEarthquakes(limit = 20) {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from('earthquakes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getEarthquakes error:', error.message);
    return [];
  }
  return data ?? [];
}
