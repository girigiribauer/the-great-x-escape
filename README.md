# X大脱出 - The Great X Escape

地獄の収容所からトンネルを掘り、Xから脱獄するというジョークコンテンツ

## 技術スタック

- **SolidStart**(SolidJS) — フロントエンド＋サーバールート
- **Supabase**(Postgres) — データストア。アクセスはサーバー(service_role)経由のみ、RLS 有効・公開ポリシーなし
- **Vercel** — ホスティング(`vercel` preset)
- **X OAuth 2.0**(Authorization Code + PKCE) — 本人確認。トークンは保持せず、HMAC 署名 Cookie でセッション
- **Bluesky OAuth**(`@atproto/oauth-client-node`) — 脱獄(移行)時の本人確認

## ローカル開発

前提: Node.js、Docker(ローカル Supabase 用)。

```sh
npm install

# 環境変数: .env.example をコピーして埋める
cp .env.example .env

# ローカル Supabase を起動(API:1964 / DB:1965 / Studio:1967)
npm run db:start

# スキーマ適用 + シード投入(テスト用のデモルームが入る)
npm run db:reset

# 開発サーバー(http://localhost:1963)
npm run dev
```

- Bluesky OAuth はループバック要件があるため、**`http://127.0.0.1:1963`** でアクセスしてください。
- Supabase 管理画面(Studio): http://localhost:1967

## テスト

```sh
npm test
npm run test:e2e
```

## ライセンス

- コード・アセットとも **MIT License**（[LICENSE](LICENSE)）。`public/` 内の画像・写真はすべて作者自身によるものです。
- 題字フォントは **[源界明朝](https://booth.pm/ja/items/1028548)**(フロップデザイン / SIL Open Font License 1.1)を使用しています。フォントファイルは同梱しておらず、ロゴ画像の作成にのみ使用しています。
