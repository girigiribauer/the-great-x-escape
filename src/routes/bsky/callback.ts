import type { APIEvent } from "@solidjs/start/server";
import { getOAuthClient } from "~/lib/oauthClient";
import { normalizeXHandle, type Status } from "~/lib/status";
import { getSupabaseClient } from "~/lib/supabaseClient";
import { getXIdentity } from "~/lib/xIdentity";

/**
 * GET /bsky/callback — Bluesky の認可後の戻り先。
 * - OAuth セッションを確立(session.did が本人確認済みの Bluesky DID)。
 * - state の {entryId, status, slug} を取り出し、X 本人であることを再確認して行を更新。
 * - 併用中 / 移行済み を self_confirmed=true で確定。
 */
export async function GET(event: APIEvent) {
  const url = new URL(event.request.url);

  let did: string;
  let stateRaw: string | undefined;
  try {
    const client = await getOAuthClient();
    const result = await client.callback(url.searchParams);
    did = result.session.did;
    stateRaw = result.state ?? undefined;
  } catch {
    return Response.redirect(`${url.origin}/?bsky_error=oauth_failed`, 302);
  }

  let entryId = "";
  let status: Status = "migrated";
  let slug = "";
  try {
    const parsed = JSON.parse(stateRaw ?? "{}");
    entryId = String(parsed.entryId ?? "");
    status = parsed.status === "both" ? "both" : "migrated";
    slug = String(parsed.slug ?? "");
  } catch {
    // state が壊れていても致命ではない。トップへ。
    return Response.redirect(`${url.origin}/?bsky_error=bad_state`, 302);
  }

  const identity = await getXIdentity();
  const supabase = getSupabaseClient();
  const { data: entry } = await supabase
    .from("entries")
    .select("id, x_handle")
    .eq("id", entryId)
    .maybeSingle();
  if (!entry || !identity || normalizeXHandle(entry.x_handle) !== identity.handle) {
    return Response.redirect(`${url.origin}/t/${slug}?bsky_error=not_your_row`, 302);
  }

  // DID から公開プロフィールを引いて正規の handle を得る(失敗時は DID を使う)。
  let blueskyHandle = did;
  try {
    const res = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(did)}`,
    );
    if (res.ok) {
      const profile = await res.json();
      if (profile?.handle) blueskyHandle = profile.handle;
    }
  } catch {
    // 無視
  }

  await supabase
    .from("entries")
    .update({
      bluesky_did: did,
      bluesky_handle: blueskyHandle,
      status,
      self_confirmed: true,
    })
    .eq("id", entryId);

  return Response.redirect(`${url.origin}/t/${slug}`, 302);
}
