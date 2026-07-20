import { action } from "@solidjs/router";
import { getSupabaseClient } from "~/lib/supabaseClient";
import { normalizeXHandle, type Status } from "~/lib/status";
import { getXIdentity } from "~/lib/xIdentity";

// 本人が直接扱えるのは X 本人確認だけで足りる範囲。migrated/both は Bluesky ログインが要るので別フロー。
const X_ONLY_STATUSES: Status[] = ["not_migrated", "stayed"];

export const setMyStatus = action(async (entryId: string, status: Status) => {
  "use server";
  if (!X_ONLY_STATUSES.includes(status)) {
    return new Error("この状態にするには Bluesky でのログインが必要です");
  }

  const identity = await getXIdentity();
  if (!identity) return new Error("ステータス変更には X ログインが必要です");

  const supabase = getSupabaseClient();
  const { data: entry } = await supabase
    .from("entries")
    .select("id, x_handle")
    .eq("id", entryId)
    .maybeSingle();
  if (!entry) return new Error("対象の行が見つかりません");
  if (normalizeXHandle(entry.x_handle) !== identity.handle) {
    return new Error("これはあなたの行ではありません");
  }

  const { error } = await supabase
    .from("entries")
    .update({
      status,
      x_verified: true,
      x_user_id: identity.userId,
      // 残留=確定してロック。収容に戻すと確定解除(誤爆の取り消しを可能にする)。
      self_confirmed: status === "stayed",
    })
    .eq("id", entryId);
  if (error) return new Error("更新に失敗しました");

  return { ok: true };
}, "setMyStatus");

// not_migrated(収容)は誤操作の取り消し用に許可。
const ADMIN_STATUSES: Status[] = ["not_migrated", "stayed", "migrated", "both"];

async function resolveBskyProfile(handle: string): Promise<{ did: string; handle: string } | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(handle)}`,
      { signal: ctrl.signal },
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const p = (await res.json()) as { did?: string; handle?: string };
    return p.did && p.handle ? { did: p.did, handle: p.handle } : null;
  } catch {
    return null;
  }
}

// 脱獄の代理記録は「未検証の追認」: 当人のログインを要さず、作成者が当人の Bluesky を入力して記録する。
// 当人が後で本人ログインすれば確定(self_confirmed)に昇格する。
export const adminSetStatus = action(async (entryId: string, status: Status, blueskyHandle?: string) => {
  "use server";
  if (!ADMIN_STATUSES.includes(status)) {
    return new Error("この状態には変更できません");
  }

  const identity = await getXIdentity();
  if (!identity) return new Error("X ログインが必要です");

  const supabase = getSupabaseClient();
  const { data: entry } = await supabase
    .from("entries")
    .select("id, room_id, self_confirmed")
    .eq("id", entryId)
    .maybeSingle();
  if (!entry) return new Error("対象の行が見つかりません");

  const { data: room } = await supabase
    .from("rooms")
    .select("admin_x_user_id")
    .eq("id", entry.room_id)
    .maybeSingle();
  if (!room || room.admin_x_user_id !== identity.userId) {
    return new Error("代理での記録は、このトンネルの作成者のみ行えます");
  }
  if (entry.self_confirmed) {
    return new Error("本人が確定済みの行は編集できません");
  }

  if (status === "stayed" || status === "not_migrated") {
    const { error } = await supabase.from("entries").update({ status }).eq("id", entryId);
    if (error) return new Error("更新に失敗しました");
    return { ok: true };
  }

  const raw = (blueskyHandle ?? "").trim().replace(/^@+/, "");
  if (!raw) return new Error("当人の Bluesky ハンドルを入力してください");
  const profile = await resolveBskyProfile(raw);
  if (!profile) return new Error("その Bluesky ハンドルが見つかりません");

  const { error } = await supabase
    .from("entries")
    .update({
      status,
      bluesky_did: profile.did,
      bluesky_handle: profile.handle,
      self_confirmed: false,
    })
    .eq("id", entryId);
  if (error) return new Error("更新に失敗しました");

  return { ok: true };
}, "adminSetStatus");
