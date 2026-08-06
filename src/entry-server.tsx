// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";
import { getRequestEvent } from "solid-js/web";

const TITLE = "X大脱出 — The Great X Escape";
const DESCRIPTION =
  "どこかにある『X』という名の地獄の収容所。囚人たちは仲間と示し合わせてトンネルを掘る。青い鳥が羽ばたけるような、自由な青空を目指して───。XからBlueskyへの移行を仲間内で記録・共有する、非公式のお遊びコンテンツです。";

export default createHandler(() => {
  const ogImage = `${process.env.PUBLIC_URL ?? ""}/ogimage.png`;
  // 限定公開の名簿(/t/…)と作成者専用の一覧(/tunnels)は検索結果に載せない。
  // robots.txt の Disallow は「取得するな」で、外部リンク経由の URL 索引までは防げないため、
  // meta robots で「索引するな」も併せて出す(共有リンクが貼られた瞬間から効く)。
  const path = new URL(getRequestEvent()?.request.url ?? "http://x/").pathname;
  const noindex = path.startsWith("/t/") || path.startsWith("/tunnels");
  return (
    <StartServer
      document={({ assets, children, scripts }) => (
        <html lang="ja">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            {noindex && <meta name="robots" content="noindex, nofollow" />}
            <title>{TITLE}</title>
            <meta name="description" content={DESCRIPTION} />
            <link rel="icon" type="image/png" href="/favicon.png" />
            <link rel="apple-touch-icon" href="/favicon.png" />

            {/* OGP / X(Twitter)カード。本番では PUBLIC_URL を設定して絶対URLにする
                (スクレイパは絶対URLを要求するため)。ローカルは相対で描画確認のみ。 */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={TITLE} />
            <meta property="og:description" content={DESCRIPTION} />
            <meta property="og:image" content={ogImage} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={TITLE} />
            <meta name="twitter:description" content={DESCRIPTION} />
            <meta name="twitter:image" content={ogImage} />
            {assets}
          </head>
          <body>
            <div id="app">{children}</div>
            {scripts}
          </body>
        </html>
      )}
    />
  );
});
