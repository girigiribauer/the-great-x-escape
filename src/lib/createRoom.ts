import { action, redirect } from "@solidjs/router";
import { parseHandlesInput } from "~/lib/status";
import { getSupabaseClient } from "~/lib/supabaseClient";
import { generateSlug, generateTunnelName } from "~/lib/tunnelName";
import { getXIdentity } from "~/lib/xIdentity";

/**
 * トンネルを掘る(ルーム作成)。
 *
 * SPEC ①ルーム作成:
 * - X ログイン必須(getXIdentity で X OAuth の本人セッションを解決)
 * - ログインした X アカウントを自動的に1行目=管理者(審判)行として登録。X認証済み・未移行。
 * - 続けて手入力の他ハンドルを追加(自己申告・未検証)。
 * - 見届ける仲間が1人以上必要(審判1人だけのトンネルは掘れない)。
 * - 推測不能な slug と 表示用トンネル名(Tom/Dick/Harry+乱数)を発行。
 */
export const digTunnel = action(async (formData: FormData) => {
  "use server";

  const identity = await getXIdentity();
  if (!identity) return new Error("トンネルを掘るには X ログインが必要です");
  const adminHandle = identity.handle;

  const players = parseHandlesInput(String(formData.get("handles") ?? ""), [adminHandle]);
  if (players.length === 0) {
    return new Error("見届ける仲間を1人以上入れてください(自分だけでは掘れません)");
  }

  const supabase = getSupabaseClient();

  // slug は推測不能かつ一意。万一衝突したら数回リトライ。
  let slug = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateSlug();
    const { data: existing } = await supabase
      .from("rooms")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!existing) {
      slug = candidate;
      break;
    }
  }
  if (!slug) return new Error("トンネルの掘削に失敗しました。もう一度お試しください");

  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .insert({ slug, tunnel_name: generateTunnelName(), admin_x_user_id: identity.userId })
    .select("id, slug")
    .single();
  if (roomErr || !room) return new Error("トンネルの作成に失敗しました");

  const rows = [
    // 作成者(審判)行: X認証済み、初期ステータスは未移行、まだ自己確定していない。
    // 所有権は rooms.admin_x_user_id が持つ(この行は x_user_id 一致で作成者と判定される)。
    {
      room_id: room.id,
      x_handle: adminHandle,
      x_verified: true,
      x_user_id: identity.userId,
      status: "not_migrated",
      self_confirmed: false,
    },
    // プレイヤー行: 手入力・未検証
    ...players.map((h) => ({
      room_id: room.id,
      x_handle: h,
      x_verified: false,
      status: "not_migrated",
      self_confirmed: false,
    })),
  ];

  const { error: entriesErr } = await supabase.from("entries").insert(rows);
  if (entriesErr) {
    // 内輪ツールなので簡易ロールバック(room を消す)で十分。
    await supabase.from("rooms").delete().eq("id", room.id);
    return new Error("メンバーの登録に失敗しました");
  }

  // 掘り終わったら、そのトンネルへ。
  throw redirect(`/t/${room.slug}`);
}, "digTunnel");
