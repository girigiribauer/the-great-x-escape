import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// 純粋ロジックの単体テスト用。Solid コンポーネントは対象外(node 環境)。
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
