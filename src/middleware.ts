import { createMiddleware } from "@solidjs/start/middleware";

// ローカル開発のみ: Bluesky のループバック OAuth は redirect_uri に 127.0.0.1(ループバックIP)を
// 要求し、localhost(ホスト名)は使えない。localhost で来たら 127.0.0.1 に寄せて、
// OAuth コールバックの接続失敗や、セッション Cookie のホスト不一致(localhost と 127.0.0.1 は
// 別オリジン扱い)を防ぐ。本番(Vercel ドメイン)ではホスト名が localhost にならないため無効。
export default createMiddleware({
  onRequest: (event) => {
    if (!import.meta.env.DEV) return;
    const url = new URL(event.request.url);
    if (url.hostname === "localhost") {
      url.hostname = "127.0.0.1";
      return Response.redirect(url.toString(), 307);
    }
  },
});
