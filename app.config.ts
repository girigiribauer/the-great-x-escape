import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  // Vercel 上でサーバールート(OAuth callback 等)を動かすため vercel preset を使用。
  // ローカル開発時は無視され、node ベースで dev サーバーが立つ。
  server: {
    preset: "vercel",
  },
});
