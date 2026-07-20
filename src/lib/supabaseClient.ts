import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * サーバー専用の Supabase クライアント。
 * service_role キーを使い RLS をバイパスする。クライアントへ絶対に露出させない。
 * (このモジュールはサーバールートからのみ import すること)
 */
let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です。.env を確認してください。",
    );
  }

  _client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}
