import { defineConfig } from "@solidjs/start/config";

// localhost → 127.0.0.1 の寄せ(Bluesky ループバック OAuth 用)は dev だけの関心事なので、
// dev ビルドのときだけミドルウェアを登録する。本番ビルドではキー自体を付けない
// = バンドルに含まれず・実行もされない(product に dev 都合を混ぜない)。
const isDev = process.env.NODE_ENV !== "production";

export default defineConfig({
  ...(isDev ? { middleware: "./src/middleware.ts" } : {}),
  // Vercel 上でサーバールート(OAuth callback 等)を動かすため vercel preset を使用。
  // ローカル開発時は無視され、node ベースで dev サーバーが立つ。
  server: {
    preset: "vercel",
  },
});
