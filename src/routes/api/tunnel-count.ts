import type { APIEvent } from "@solidjs/start/server";
import { getSupabaseClient } from "~/lib/supabaseClient";

/**
 * GET /api/tunnel-count → { "count": <掘られたトンネル総数> }
 *
 * 目的は2つ:
 * 1. 誰かがアクセスするたび Supabase へ問い合わせが走り、無料枠の自動一時停止を防ぐ。
 * 2. 保険として GitHub Actions の cron から1日1回叩き、無アクセスの日も止めない。
 *
 * 限定公開の原則: 返すのは「件数」だけ。トンネル名/slug/一覧は一切返さない。
 */
export async function GET(_event: APIEvent) {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from("rooms")
    .select("*", { count: "exact", head: true });

  if (error) {
    return new Response(JSON.stringify({ error: "count_failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ count: count ?? 0 }), {
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}
