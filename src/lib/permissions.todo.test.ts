import { describe, it } from "vitest";

/**
 * 権限・認可・状態遷移の「テスト観点」を明文化したもの(TODO)。
 * これらは Supabase(DB)への依存があり、実装には DB のモックか統合テスト基盤が要る。
 * まずは観点を漏れなく列挙し、抜けを可視化する。純粋ロジックは status.test / signedCookie.test で実施済み。
 */

describe("setMyStatus(本人の状態申告)", () => {
  it.todo("未ログインなら拒否する");
  it.todo("自分の行(x_handle が本人)以外は『あなたの行ではありません』で拒否する");
  it.todo("残留を選ぶと self_confirmed=true で確定・ロックされる");
  it.todo("収容(not_migrated)に戻すと self_confirmed=false になり取り消せる ← 実バグ修正の回帰");
  it.todo("migrated/both は本人の Bluesky ログインが要るのでこの経路では拒否する");
});

describe("adminSetStatus(作成者の代理記録)", () => {
  it.todo("そのルームの作成者(admin)本人以外は拒否する");
  it.todo("本人が確定済み(self_confirmed)の行は編集できない");
  it.todo("残留 / 収容は Bluesky ハンドル不要で更新できる");
  it.todo("脱獄(migrated/both)は当人の Bluesky ハンドル必須。空なら拒否する");
  it.todo("脱獄は公開 getProfile で did/handle を解決し、見つからなければ拒否する");
  it.todo("代理記録は self_confirmed=false のまま(本人が後で確定に昇格できる)");
});

describe("deleteRoom(部屋削除)", () => {
  it.todo("未ログインなら拒否する");
  it.todo("作成者(admin)本人以外は拒否する");
  it.todo("削除すると entries も cascade で消える");
});

describe("digTunnel(ルーム作成)", () => {
  it.todo("X ログイン必須");
  it.todo("有効な仲間が0人(自分だけ/空)なら作成できない");
  it.todo("作成者を1行目に自動追加し(所有権は rooms.admin_x_user_id)、重複ハンドルは除去する");
});

describe("getMyTunnels(作成者向け一覧)", () => {
  it.todo("自分が admin の部屋だけを返す");
  it.todo("未ログインは空配列");
});

describe("認証セッション(xIdentity)", () => {
  it.todo("改竄された署名 Cookie は未ログイン扱い(null)になる ← signedCookie.test で署名検証は担保済み");
  it.todo("saveXIdentity は RPC 化されておらず、クライアントから直接叩けない(ハンドル捏造防止)");
});
