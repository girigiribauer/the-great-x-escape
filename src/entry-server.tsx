// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

const TITLE = "X大脱出 — The Great X Escape";
const DESCRIPTION =
  "どこかにある『X』という名の地獄の収容所。囚人たちは仲間と示し合わせてトンネルを掘る。青い鳥が羽ばたけるような、自由な青空を目指して───";

export default createHandler(() => {
  const ogImage = `${process.env.PUBLIC_URL ?? ""}/ogimage.png`;
  return (
    <StartServer
      document={({ assets, children, scripts }) => (
        <html lang="ja">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
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
