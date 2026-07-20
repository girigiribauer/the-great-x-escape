import { defineConfig } from "@playwright/test";

// E2E は「ログイン後のフロー」を対象にする(X OAuth の往復は対象外)。
// 署名セッション Cookie を偽造してログイン状態を注入する(e2e/helpers.ts)。
// ローカル Supabase と dev サーバー(1963)が動いている前提。
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false, // DB を共有するので直列
  workers: 1,
  retries: 1, // dev の SSR ハイドレーションのタイミングによる一過性フレークの保険

  reporter: "list",
  globalTeardown: "./e2e/globalTeardown.ts",
  use: {
    baseURL: "http://localhost:1963",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:1963",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
