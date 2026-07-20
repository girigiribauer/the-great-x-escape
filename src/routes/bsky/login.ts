import type { APIEvent } from "@solidjs/start/server";
import { getOAuthClient } from "~/lib/oauthClient";
import { normalizeXHandle } from "~/lib/status";
import { getSupabaseClient } from "~/lib/supabaseClient";
import { getXIdentity } from "~/lib/xIdentity";

/**
 * GET /bsky/login?entryId=..&status=migrated|both&slug=..&handle=your.bsky.social
 *
 * 本人が自分の行に Bluesky を紐付けるための入口。
 * - X 本人であること(行の x_handle と一致)を確認してから authorize。
 * - authorize の state に {entryId, status, slug} を載せ、callback で使う。
 * 成功すると Bluesky(PDS)の認可画面へリダイレクトする。
 */
export async function GET(event: APIEvent) {
  const url = new URL(event.request.url);
  const handle = url.searchParams.get("handle")?.trim() ?? "";
  const entryId = url.searchParams.get("entryId") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const slug = url.searchParams.get("slug") ?? "";

  const back = (err: string) =>
    Response.redirect(`${url.origin}/t/${slug}?bsky_error=${err}`, 302);

  if (!handle) return back("bluesky_handle_required");
  if (status !== "migrated" && status !== "both") return back("bad_status");

  const identity = await getXIdentity();
  if (!identity) return back("x_login_required");

  const supabase = getSupabaseClient();
  const { data: entry } = await supabase
    .from("entries")
    .select("id, x_handle")
    .eq("id", entryId)
    .maybeSingle();
  if (!entry) return back("entry_not_found");
  if (normalizeXHandle(entry.x_handle) !== identity.handle) return back("not_your_row");

  try {
    const client = await getOAuthClient();
    const state = JSON.stringify({ entryId, status, slug });
    const authUrl = await client.authorize(handle, { scope: "atproto", state });
    return Response.redirect(authUrl.toString(), 302);
  } catch (err) {
    // 握り潰すと本番で原因が追えないので必ずログに残す(Vercel の Functions ログに出る)。
    console.error("[bsky/login] authorize failed:", err);
    return back("bluesky_authorize_failed");
  }
}
