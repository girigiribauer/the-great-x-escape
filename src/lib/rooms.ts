import { action, query } from "@solidjs/router";
import { getSupabaseClient } from "~/lib/supabaseClient";
import type { Status } from "~/lib/status";
import { getXIdentity } from "~/lib/xIdentity";
import type { EntryRow, RoomRow } from "~/types/database";

/**
 * トップページ用: 掘られたトンネル(ルーム)の総数のみを返す。
 *
 * ルームは限定公開(推測不能なランダムURLを知っている人だけが使う)なので、
 * 一覧・トンネル名・slug などは一切公開しない。件数だけを返すこと。
 *
 * リクエストのたびに Supabase へ問い合わせることで無料枠の自動一時停止も防ぐ
 * (SPEC「Supabase無料プランの制約と対策」)。
 */
export const getTunnelCount = query(async (): Promise<number> => {
  "use server";
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from("rooms")
    .select("*", { count: "exact", head: true });
  if (error) throw error;

  return count ?? 0;
}, "tunnelCount");

/** ルームページに表示する1行分(クライアントへ送ってよい範囲) */
export type RosterEntry = {
  id: string;
  xHandle: string;
  isAdmin: boolean;
  xVerified: boolean;
  blueskyHandle: string | null;
  status: Status;
  selfConfirmed: boolean;
  /** Bluesky アバターURL(取得できた場合のみ)。X だけの人は null=顔なし。 */
  avatarUrl: string | null;
};

/** Bluesky 公開API(認証不要)でアバターURLを取得。取れなければ null。 */
async function fetchBskyAvatar(actor: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(actor)}`,
      { signal: ctrl.signal },
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const profile = (await res.json()) as { avatar?: unknown };
    return typeof profile.avatar === "string" ? profile.avatar : null;
  } catch {
    return null;
  }
}

export type RoomDetail = {
  slug: string;
  tunnelName: string;
  createdAt: string;
  roster: RosterEntry[];
  /** ナレーション字幕をランダムに選ぶための種。SSR/クライアントでズレないようサーバーで1回引く。 */
  captionSeed: number;
};

/**
 * slug からルーム1件と名簿を取得する。
 * ルームは限定公開なので slug を知っている人だけがここに到達する前提。
 * 見つからなければ null(呼び出し側で 404 表示)。
 */
export const getRoom = query(async (slug: string): Promise<RoomDetail | null> => {
  "use server";
  const supabase = getSupabaseClient();

  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .select("id, slug, tunnel_name, admin_x_user_id, created_at")
    .eq("slug", slug)
    .maybeSingle<RoomRow>();
  if (roomErr) throw roomErr;
  if (!room) return null;

  const { data: entries, error: entriesErr } = await supabase
    .from("entries")
    .select("id, x_handle, x_user_id, x_verified, bluesky_handle, status, self_confirmed")
    .eq("room_id", room.id)
    // 作成者行が最初に挿入されるので、登録順で先頭に来る
    .order("created_at", { ascending: true })
    .returns<
      Pick<
        EntryRow,
        "id" | "x_handle" | "x_user_id" | "x_verified" | "bluesky_handle" | "status" | "self_confirmed"
      >[]
    >();
  if (entriesErr) throw entriesErr;

  const roster: RosterEntry[] = await Promise.all(
    (entries ?? []).map(async (e) => ({
      id: e.id,
      xHandle: e.x_handle,
      // 作成者行かどうかは所有者 user_id との一致で導出(admin_x_user_id は not null なので誤判定なし)
      isAdmin: e.x_user_id === room.admin_x_user_id,
      xVerified: e.x_verified,
      blueskyHandle: e.bluesky_handle,
      status: e.status,
      selfConfirmed: e.self_confirmed,
      // Bluesky ハンドルがある人だけ、公開APIで顔(アイコン)を取得。X だけの人は null。
      avatarUrl: e.bluesky_handle ? await fetchBskyAvatar(e.bluesky_handle) : null,
    })),
  );

  return {
    slug: room.slug,
    tunnelName: room.tunnel_name,
    createdAt: room.created_at,
    roster,
    captionSeed: Math.random(),
  };
}, "room");

export type MyTunnel = { slug: string; tunnelName: string; memberCount: number; createdAt: string };

// 自分が作った部屋を自分にだけ見せるのは限定公開([[rooms-are-unlisted]])に反しない(URL喪失時の復帰用)。
export const getMyTunnels = query(async (): Promise<MyTunnel[]> => {
  "use server";
  const identity = await getXIdentity();
  if (!identity) return [];

  const supabase = getSupabaseClient();
  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, slug, tunnel_name, created_at")
    .eq("admin_x_user_id", identity.userId)
    .order("created_at", { ascending: false });

  return Promise.all(
    (rooms ?? []).map(async (room) => {
      const { count } = await supabase
        .from("entries")
        .select("*", { count: "exact", head: true })
        .eq("room_id", room.id);
      return {
        slug: room.slug,
        tunnelName: room.tunnel_name,
        memberCount: count ?? 0,
        createdAt: room.created_at,
      };
    }),
  );
}, "myTunnels");

// entries は ON DELETE CASCADE で一緒に消える。
export const deleteRoom = action(async (slug: string) => {
  "use server";
  const identity = await getXIdentity();
  if (!identity) return new Error("ログインが必要です");

  const supabase = getSupabaseClient();
  const { data: room } = await supabase
    .from("rooms")
    .select("id, admin_x_user_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!room) return new Error("トンネルが見つかりません");

  if (room.admin_x_user_id !== identity.userId) {
    return new Error("このトンネルを消せるのは作成者だけです");
  }

  const { error } = await supabase.from("rooms").delete().eq("id", room.id);
  if (error) return new Error("削除に失敗しました");
  return { ok: true };
}, "deleteRoom");
