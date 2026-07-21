# X大脱出 (The Great X Escape) — 仕様・設計ドキュメント

> このファイルはプロジェクトの単一の正典（source of truth）。
> 元となった構想メモに、検討で確定した事項を反映して一本化したもの。
> 変更が生じたら「決定事項ログ」に追記していく。

---

## 概要

XからBlueskyへの移行を、仲間内で「誰が最後まで抜けられずにいるか」を競うゲーム形式で促すWebサービス。

- コンセプトの元ネタ: 映画『大脱走』(The Great Escape, 1963) のオマージュ
- ページを作ることを「トンネルを掘る」と呼ぶ
- 既存の姉妹プロダクト:
  - https://bluesky-official-accounts.vercel.app/ (公式アカウント移行まとめ)
  - https://girigiribauer.com/products/flyfree-glide/ (クロスポストツール)

### 狙い・ゲームの構造

- ネットワーク効果の破壊が目的。Xを潰したいわけではなく、移りたいけど移れない人の後押しをしたい
- 管理者(ルーム作成者)は基本的にすでに移行済み/移行寄りの立場で、審判ポジション
- リスト内の他アカウントがゲームのプレイヤー(まだ迷っている側)
- 管理者は自分自身もリストに含める必要がある(一方的な監視構造にしないため)
- URLは推測不能なランダム文字列にして限定公開とし、共有方法(X上でメンション付き投稿するか、内輪だけで回すか)はユーザーの自由に委ねる

---

## 世界観・トーン

- 劇画調・往年の洋画ポスター風のビジュアル(大脱走のオマージュ)
- 太めの筆文字/セリフ体ロゴ、モノクロ〜セピア基調 + 差し色1色
- ルーム名は「トンネル名」という体裁で、以下からランダムに1つ + ランダム数字を組み合わせる
  - `Tom`, `Dick`, `Harry` (映画に登場する脱出トンネルの愛称)
  - 例: `Tom123`, `Dick357`, `Harry042`
  - ※このトンネル名はあくまで表示用の名前。実際のアクセスURLとは別の、無関係なランダム文字列にする(URL自体が推測されないようにするため)

> **UI/ビジュアルの扱い**: デザインは後工程でオーナー主導で詰める。当面は「一旦動くところまで」を優先。
> ただしコピー(文言)を書くときは、この劇画調・大脱走オマージュのトーンをベースに考える。

---

## 命名

- サービス名(表示用): **X大脱出**
- 英語名: **The Great X Escape**
- ディレクトリ名: `TheGreatXEscape`

---

## 権限モデル

### ロール

| ロール | 説明 |
|---|---|
| 管理者(作成者) | ルームを作成した人。基本的にすでに移行済み/移行寄りの立場 |
| プレイヤー | リストに登録されている、管理者以外の全アカウント(管理者自身もリストの1行として含まれる) |

### 権限の違いは以下の2点のみ

1. **ルーム作成権**: 管理者だけがルームを新規作成できる
2. **他人の行の編集権**: 管理者は自分以外の行のステータスも編集できる(放置対策)
   - ただし、**本人が一度自己申告で確定させた行は、管理者による上書き対象から除外**する(ロック)
   - 本人が未確定の行のみ、管理者が代理で編集可能

上記以外の機能(ステータス変更のフロー自体)は、管理者・プレイヤーで完全に共通。管理者専用のステータス変更機能は存在しない。

---

## 認証・ステータス変更フロー

### 前提: 認証には2つの目的がある

1. Xの本人確認(「このXアカウントは本当にあなたか」)
2. Blueskyの本人確認(「このBlueskyアカウントは本当にあなたか」)

### ① ルーム作成(トンネルを掘る)

- **Xログイン必須**(ログインしていないと作成できない)
- ログインしたXアカウントが自動的にリストの1行目(管理者行)として登録される。この時点でX認証済み・ステータスは「未移行」
- 管理者は続けて、見届けたい他のXアカウント(@handle)を**手入力**で追加していく(この時点では自己申告・未検証でよい)
- 管理者自身を含んでいないルームは作成不可(バリデーション必須)
- ランダムなURL(無関係な文字列)を発行、表示用のトンネル名(Tom/Dick/Harry + 乱数)を割り当てる

### ② ステータス変更(管理者・プレイヤー共通のフロー)

1. ルームページにアクセス
2. リストの中から「これが自分だ」という行を選ぶ、またはX OAuth後に一致する行を自動検出
3. **Xでログイン** → その行が本人であることを証明
4. ここでステータスを分岐:
   - **「Xに残ります」を選ぶ** → ここでフロー完了(= 残留)。Blueskyアカウントの有無に関わらず選択可能、Blueskyログイン不要
   - **「もうBlueskyやってる/移行した」を選ぶ** → **Blueskyでログイン**(OAuth)してハンドルを紐付け、「併用中」または「移行済み」を確定

### ③ 管理者による代理編集

- 管理者はリスト内の任意の行(本人が未確定のもの)のステータスを編集できる
- 管理者の代理編集は「申請」ではなく直接反映でよい(仲間内の内輪の運用なので、真偽の厳密な担保は不要という前提)
- 本人が一度確定させた行は編集不可(ロック)

### ステータス(4値)

初期状態は **収容**。「未定」という値は廃止(Blueskyアカウントの有無が不明なら「無い=収容」とみなす)。
DBの enum キーは変えず、**表示ラベルを劇画調に更新**した(2026-07-19)。移行系は「脱獄」1種類にまとめ、完全移行/両方運用中は補足テキストで区別。

| DB enum(不変) | 表示ラベル | 意味 |
|---|---|---|
| `not_migrated` | **収容**(旧: 未移行) | 初期状態。まだ壁の中(移行前) |
| `stayed` | **残留** | 「Xに残る」を本人が選択(Bluesky認証不要) |
| `both` | **脱獄（両方運用中）**(旧: 併用中) | X・Blueskyを両方(Bluesky認証済み) |
| `migrated` | **脱獄（完全移行）**(旧: 移行済み) | Blueskyへ完全移行(Bluesky認証済み) |

状態遷移の概略:

```
収容(初期)
  ├─ Xでログイン →「Xに残る」            → 残留
  └─ Xでログイン →「Blueskyやってる/移行」→ Blueskyでログイン → 脱獄(両方運用中) / 脱獄(完全移行)
```

### ルームページの表現(2026-07-19 実装)

名簿は「囚人名簿」の体裁。各行 = 囚人No.(連番アイコン) / 囚人名 / 状況。
- **収容/残留の人 = 顔なしの縞の囚人シルエット**(`public/icon-user.svg`)＋体に3桁番号。
- **脱獄した人(both/migrated) = Bluesky の実アバター(顔)**が現れる(公開API `app.bsky.actor.getProfile` で取得、認証不要)。「脱獄したら顔が見える」メタファー。
- **脱獄した人は X ハンドルに打ち消し線**、隣に Bluesky ハンドルを併記(両方リンク)。
- 状況ラベルはグランジ SVG(`public/label-*.svg`: 脱獄/残留/収容)。
- 名簿の上にランダムのナレーション字幕(劇画調・状況連動。実映画のセリフは引用せずオマージュ)。

---

## データが持つべき情報(実装は自由、以下は最低限の要件)

- ルーム(トンネル)の識別子: ランダムURL用の文字列、表示用トンネル名(Tom/Dick/Harry + 乱数)、**作成者(所有者)の X user_id(不変)**
- リスト内の各行:
  - Xアカウント名(管理者/プレイヤーが手入力、自己申告)
  - X認証済みかどうか、認証済みならX側のuser_id(この user_id がルームの所有者 user_id と一致する行が作成者)
  - Blueskyハンドル(認証済みの場合のみ)
  - ステータス: 未移行 / 併用中 / 移行済み / 残留
  - 本人確定済みかどうか(管理者の編集ロック判定用)

---

## 技術スタック

| レイヤー | 選択 | 流用元 / 備考 |
|---|---|---|
| フロントエンド | **SolidJS**(Reactは使用しない) | 書き方は `~/works/FlyFree-Glide` を参考 |
| ホスティング | **Vercel** | |
| DB | **Supabase**(既存組織 `girigiribauer` の2プロジェクト目の無料枠) | |
| Bluesky認証 | **OAuth 確定** | `~/works/bluesky-official-accounts` の実装を移植(下記) |
| X認証 | **X OAuth 2.0 (Authorization Code + PKCE)** | 実装済み。方式A(トークン非保持・署名Cookieセッション)(下記) |

### Bluesky OAuth(流用)

`bluesky-official-accounts` に完成した実装があり、これをほぼそのまま移植する。

- ライブラリ: `@atproto/oauth-client-node`(サーバーサイド `NodeOAuthClient`)
- OAuthのstate/sessionを **Supabaseテーブルに保存**する `stateStore` / `sessionStore` 実装済み
- login / callback / logout / client-metadata / jwks の各ルート一式あり
- ローカルはループバック用メタデータ、本番は公開URLでメタデータを切り替える実装済み

### X OAuth(実装済み)

- 目的は「**ログインさせて本人の user_id と handle を取るだけ**」。ツイート取得・検索は一切しない。
- **X検索API等の有料機能は使わない**(方針として明確に禁止)。`GET /2/users/me` を1回叩く最小構成。
- **方式A(セッション保持)**: 本人確認できたら access_token は捨て、userId/handle を**署名(封緘)Cookie** に保存して以後はそれで回す。リフレッシュトークンは持たない(`offline.access` スコープを付けない)。セッション寿命はうちの Cookie 側で自由に決められる。将来 Xを代理で叩く機能を足す段になって初めてトークン保持(方式B)を検討する。
- **実装構成**:
  - `src/lib/xOAuth.ts` — PKCE生成 / authorize URL 組み立て / トークン交換(Basic認証=機密クライアント)/ `users/me`
  - `src/routes/x/login.ts` — PKCE+stateを短命httpOnly Cookieに退避し、Xの認可画面へリダイレクト(`?redirectTo=` で戻り先指定)
  - `src/routes/x/callback.ts` — state照合 → コード交換 → `users/me` → `saveXIdentity` でセッション保存 → 戻り先へ
  - `src/lib/xIdentity.ts` — クライアント各ページが import する。型 `XIdentity`(不変=呼び出し側無改修)/ `parseHandle`(純粋)/ `getXIdentity`(query)/ `xLogout`(action)のみ。**top-level で server-only(`node:crypto`・`vinxi/http`)を import しない**。実処理は "use server" 本体内で `~/lib/xSession` を動的 import して呼ぶ。
  - `src/lib/xSession.ts` — ★サーバー専用★。HMAC署名Cookieの読み書き(`readXIdentity`/`saveXIdentity`/`clearXIdentity`)。**クライアントの import グラフに絶対載せない**(載せると server-only モジュールがクライアントバンドルに漏れ、`<A>` 遷移時に描画が壊れる — 実際に踏んだ)。`saveXIdentity` は RPC化しない(ハンドル捏造ログイン防止)ためここに置き、x/callback とサーバー側からのみ呼ぶ。
  - スコープ: `tweet.read users.read`。エンドポイントは `x.com` / `api.x.com`。
  - 必要env: `X_CLIENT_ID` / `X_CLIENT_SECRET` / `SESSION_SECRET`(32文字以上)。
- Developer Portal: 器アカウント(@xdaidasshutsu)で Production アプリ「X大脱出」を作成。App permissions=Read、Type=Web App(機密クライアント)、Callback に `http://127.0.0.1:1963/x/callback` と `http://localhost:1963/x/callback`(+本番URL)を登録。

---

## Supabase無料プランの制約と対策

- 無料プランは組織あたり2アクティブプロジェクトまで(既存の `bluesky-official-accounts` で1つ使用中のため、残り1枠を使用)
- **7日間アクティビティがないと自動的に一時停止**される
- 対策:
  - トップページに「掘られたトンネル数(作成されたルーム数)」を表示する機能を作り、これをリクエストごとにDBへ問い合わせる形(SSRまたはクライアントサイドfetch)で実装する。ユーザーがアクセスするたびに自然にSupabaseへのAPIリクエストが発生し、一時停止を防ぐ
  - 保険として、**GitHub Actionsのscheduled workflow(cron)で1日1回、このカウント取得APIエンドポイントを叩く**仕組みを用意する(`.github/workflows/` 配下)
  - Vercel Cronではなくあえて GitHub Actions を使う理由: 前作との管理の一元化、Vercel側の設定を見に行くのを忘れるリスクを避けるため

---

## 大脱走オマージュとして使えそうな要素(参考)

- スティーブ・マックイーンのバイクジャンプシーン(脱出完了時の演出などに使えそう)
- トンネル名「Tom / Dick / Harry」(すでにルーム名に採用)
- ※史実では脱出成功者はごく少数で、多くが悲劇的結末を迎えている。パロディのトーンを完全なコメディに振り切るか、多少の重みを残すかは今後のUI/コピー次第

---

## 決定事項ログ

### 2026-07-20

- **所有権を `entries.is_admin` から `rooms.admin_x_user_id`(不変)へ移した**。ルーム作成者=所有者を「entries の管理者フラグ+『1部屋1管理者』部分ユニークidx」で表現していたのを廃止し、room 側に作成者の X `user_id` を1カラムで持たせた。**根拠は簡素化と所有権の単一化**: (1) `is_admin` カラムと部分ユニークidx(不変条件の維持コスト)が不要になる、(2) 所有権判定が entries を引かずに room 行だけで済む(`getMyTunnels` は entries join を廃して rooms 単独クエリ、`deleteRoom`/`adminSetStatus` も admin行の別クエリが消える)。名簿での「作成者行」判定は `entry.x_user_id === room.admin_x_user_id` でサーバー導出(クライアントの `RosterEntry.isAdmin` 契約は不変)。**参加者の「自分の行」判定は従来どおり handle 一致**(変えたのは所有権判定のみ)。X ハンドル改名への耐性は副次的効果で主目的ではない(改名時は新ページへ案内すれば足りる、というオーナー判断)。未ローンチのため初期 migration を直接編集+`db:reset` で反映。改修範囲: initial_schema.sql / seed.sql / types/database.ts / createRoom / rooms / statusActions / e2e globalTeardown。
- **本番限定バグ修正: Bluesky OAuth の kid 欠落**。本番で `/oauth/client-metadata.json` と `/oauth/jwks.json` が 500 → `client.authorize` が `bluesky_authorize_failed`。原因は `getOAuthClient()` の keyset 構築で、生成した JWK に `kid` が無く NodeOAuthClient が private_key_jwt 用鍵として拒否(「requires ... a signing key with a "kid" property」)。ローカルはループバックで keyset 不要のため**本番で初めて露見**。修正: `JoseKey.fromImportable(JSON.parse(OAUTH_PRIVATE_KEY), "key1")` と明示 kid を付与(保存済みキーの作り直し不要。jwks.json と private_key_jwt の kid はこの keyset で一致)。あわせて `bsky/login.ts` の握り潰し `catch {}` に `console.error` を追加(Vercel Functions ログで原因を追えるように)。
- **CI/CD の migration 戦略を決定(方式B)**。DB マイグレーションは **Vercel の build に載せない**(preview デプロイが本番DBを叩く・順序/認証の問題)。代わりに **GitHub Actions**(`.github/workflows/db-migrate.yml`)で `supabase/migrations/**` が変わった main push のときだけ `supabase link` → `db push` を実行。アプリの Vercel デプロイとは独立(素の版なので両者は並走=追加系・低頻度前提で許容。将来 deploy hook で厳密順序化も可)。要 GitHub Secrets: `SUPABASE_ACCESS_TOKEN`(個人アクセストークン)/ `SUPABASE_DB_PASSWORD`。`SUPABASE_PROJECT_REF` は公開値でインライン。**秘密の置き場**: アプリ実行 env=Vercel、migration 認証=GitHub Secrets、keepalive `APP_URL`=GitHub Variables。Vercel に Supabase の DBパスワード/トークンは不要。
- **`/login` ページを廃止**。TOP がログイン入口を兼ねるため中間の `/login` は導線から外れ、実質「OAuth 失敗時の着地」専用になっていた(オーナー未認識の残置画面)。失敗通知は TOP(`/?x_error=…`)に集約。副次的に、唯一 UI に出ていた「審判」表現(login の本文)も消え、SPEC「『審判』という語は UI に出さない」と整合。`login.tsx`/`login.module.css` 削除、`index.tsx` にエラー表示、`x/callback` の失敗リダイレクトを TOP に変更。**`x_error` は表示後に URL から掃除する**(マウント時に signal へ退避 → `history.replaceState` でクエリ除去。共有・リロードで汚さず、掃除後リロードでは再表示しない一過性通知)。
- **全員脱出のゴール演出を実装(仕様格上げ: 任意→必須)**。ゲーム形式なのにゴールが無いのは成立しない、というオーナー判断で必須化。名簿全員が脱獄(migrated/both)のトンネルだけ、ランダム字幕エリアを `public/bluesky.png`(青空)に差し替える。判定は `t/[slug].tsx` の `allEscaped()`(全員が migrated/both)。残留や未移行が1人でも残れば未達=従来のランダム字幕。CSS は字幕スロット(`.caption`)と同じ余白リズムを保つ `.escapeCard`/`.escapeImage`。dev で全員脱出(Harry301)/混在(Tom137)の両分岐を目視確認済み。
- **スキーマ堅牢化(上記と同時に実施)**: (1) `rooms.admin_x_user_id` に索引追加(所有権ルックアップの相棒)。(2) `unique(room_id, x_handle)` を関数一意索引 `unique(room_id, lower(x_handle))` に変更 — 正規化はアプリ側で行うが DB でも大文字小文字を潰して「正規化忘れの別経路」でも重複を防ぐ。(3) `entries` に CHECK 追加: `status in ('migrated','both')` なら `bluesky_did is not null`(脱獄=Bluesky認証済みの整合を DB でも担保。残留/未移行は非制約)。(4) `oauth_states` の中断ゴミ対策: `created_at` 索引 + `oauthClient` の stateStore.set で 1時間より古い state を掃く opportunistic GC(スケジューラ不要)。

### 2026-07-19

- **土台を実装**: SolidStart + ローカル Supabase(196x帯) で稼働。スキーマ(rooms/entries/oauth_states/oauth_sessions, RLS, service_role)適用済み。
- **X認証は実 X OAuth 2.0 に差し替え済み**(開発スタブを撤去)。器アカウント @xdaidasshutsu で Developer アプリ「X大脱出」(Production/機密クライアント)を作成し、Client ID/Secret を取得。方式A(トークン非保持・署名Cookieセッション)で実装。詳細は「X OAuth(実装済み)」節。
- **脱獄(migrated/both)には2つの経路がある**: (A) 当人が Bluesky OAuth で本人確認 → 検証済み・self_confirmed=true。(B) 作成者が当人の Bluesky ハンドルを知っていて代理記録 → 未検証の追認・self_confirmed=false(当人ログイン不要。乗り気でないメンバーを作成者が拾うケース)。両者は**UI上は区別しない**。当人が後から(A)を行えば(B)は確定に昇格。状況表の「Bluesky認証済み」は(A)を指すが、(B)の未検証も同じ表示になる点に注意。
- **ログイン導線の構造を確定**: TOP の CTA が入口を兼ねる。未ログインなら「Xでログインしてトンネルを掘る」= `/x/login?redirectTo=/dig` へ直行 → X の認可画面 → `/x/callback` → `/dig`(作成画面)。`/dig` は未ログインなら TOP へリダイレクト(掘る=ログイン後の画面)。※ 2026-07-20: 中間の `/login` ページは廃止(失敗着地専用で導線から外れていた)。**OAuth 失敗は `/?x_error=…` で TOP に戻して通知**(TOP がログイン入口を兼ねる)。
- **ルーム作成 = メンバーリスト作成**: ログインした自分が審判(1行目)に自動登録。テキストエリアに **プロフィールURL / @有無 / 素のハンドル** を貼り付け(改行・カンマ区切り) → 正規化して作成。実在チェックなし。
- **ステータス表示ラベルを更新**(収容/残留/脱獄), **囚人名簿ビジュアル**(縞シルエット+番号 / 脱獄で Bluesky アバター), **状況グランジSVGラベル**, **ランダムナレーション字幕** を実装(上記「ルームページの表現」参照)。
- **Bluesky OAuth 移植完了**。`/bsky/login` が実 Bluesky の認可URLへ 302(handle解決+PAR+state保存まで実地確認)。ただし**実ログインの一往復(callback→行更新)は未検証**(実 Bluesky アカウントが要る)。ローカルは `127.0.0.1:1963` でアクセスすること(loopback要件)。
- **トンネル数カウントAPI(`/api/tunnel-count`)+ GitHub Actions cron(`keepalive.yml`)** 実装。cron は本番の `APP_URL` 変数登録が必要。
- **アセットはオーナーが Figma 等で自作**(logo.svg / ogimage.png / tunnel.png(ヒーロー) / tunnel-icon.png(見出しアイコン) / icon-user.svg(囚人シルエット) / label-*.svg)。こちらは配線・検証担当。
- **全員脱出時のお祝い演出(字幕→満点の青空)** はアイデアとして保留(画像はオーナーが用意予定)。
- **未デプロイ・テスト無し**。本番設定(`PUBLIC_URL` / `OAUTH_PRIVATE_KEY` / `APP_URL` / X の Client ID・Secret / 本番Supabase)は全て未着手。

### 2026-07-18

- **Bluesky認証はOAuthで確定**。`bluesky-official-accounts` に完成品があり流用できることを確認(`@atproto/oauth-client-node` + Supabase保存のstate/session、各ルート一式)。アプリパスワード案は不採用。
- **X認証は完全な新規実装**。既存2プロジェクトのどちらにもX OAuth実装は無いことをgrepで確認。方針は X OAuth 2.0 (PKCE) で「本人のid/handle取得のみ」、`/2/users/me` の最小構成。
- **他アカウント追加はX検索API等を使わず手入力のみ**。アカウントの実在性は問わない(タイポは入力者の自己責任)。
- **ステータスの「未定」を廃止**し、初期状態を「未移行」に。4値: 未移行 / 併用中 / 移行済み / 残留。
- **UI/デザインは後工程でオーナー主導**。当面は「一旦動くところまで」を優先。文言を書くときは劇画調・大脱走オマージュのトーンをベースにする。
- フロントは SolidJS(FlyFree-Glide 参考)、サーバーサイドOAuth/Supabase は bluesky-official-accounts 参考、という組み合わせで進める。
- **ビジュアル基調を確定**: 黒地(`#1e0a08`) × 差し色=朱赤(`#ff0022`) × 本文=骨色(`#f3e6d8`)。OGPロゴ(グランジの朱赤タイトル＋ブラックレター副題)と地続き。ポート番号は映画公開年に因み1963系(dev=1963 / Supabase API=1964 / DB=1965 / Studio=1967)。
- **X OAuth は"実装着手"を後回しにする(開発順序の判断。リリース仕様として X ログインは維持)**。X Developerアプリ準備の手間を今は避け、X非依存の部分(Bluesky OAuth・ルーム作成の手入力/バリデーション・一覧・トンネル数カウント)を先行実装。開発中は X認証を差し替え可能なインターフェース＋開発用スタブで代替し、Developerアプリが用意でき次第 実物の X OAuth を差し込む。**本人確認モデル自体(X本人確認＋Bluesky本人確認)は SPEC のまま変更しない。**

---

## リリースチェックリスト(2026-07-20〜・随時更新)

> このセクションが未完了作業の**単一の真実**。完了したら `[x]` にして日付を添える。

**インフラ(本番)**
- [x] 本番 Supabase プロジェクトを用意(2026-07-20): `the-great-x-escape` / Tokyo / 無料枠。ref `cjxenpxprrecyjukxiak`。Data API=ON(supabase-js `.from()` を使うため必須)、auto-expose new tables=OFF、auto-RLS=ON。
- [x] 本番 Supabase に migration を適用(2026-07-20): `supabase link` → `db push` で `20260718000000_initial_schema.sql` を適用。`migration list` で local==remote 確認済み。
- [x] 本番の `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` を取得し Vercel へ(2026-07-21)。※ コードは anon 未使用(URL＋service_role のみ参照)なので `SUPABASE_ANON_KEY` は Vercel に入れない。
- [x] Vercel プロジェクト確保(2026-07-21): `the-great-x-escape`(Hobby)。GitHub 連携で main push=自動デプロイ。本番 `https://the-great-x-escape.vercel.app`。
- [x] Vercel `PUBLIC_URL`(2026-07-21): 本番URL。
- [x] Vercel `SESSION_SECRET`(2026-07-21): 本番用に新規生成した値。
- [x] Vercel `X_CLIENT_ID` / `X_CLIENT_SECRET`(2026-07-21)。
- [x] `OAUTH_PRIVATE_KEY`(ES256 JWK)生成(2026-07-21)。※ 生成 JWK に kid が無く NodeOAuthClient が拒否 → `fromImportable(.., "key1")` で kid 付与する修正が必要だった(本番 metadata/jwks の 500 原因)。
- [x] Vercel `OAUTH_PRIVATE_KEY`(2026-07-21)。
- [x] `.env.example` に `OAUTH_PRIVATE_KEY`(生成手順つき)を追記(2026-07-20)。ES256 JWK を `@atproto/jwk-jose` の JoseKey.generate で作る one-liner つき(コマンド実動確認済み)。
- [x] Vercel 本番 `SUPABASE_*`(2026-07-21)。
- [x] X アプリに本番 callback URL 登録(2026-07-21): `https://the-great-x-escape.vercel.app/x/callback`。※ 新 console.x.com の編集画面がバグる(appId 付きURLが404)ので appId 無しURL経由で編集。
- [x] GitHub Secrets/Variables 登録(2026-07-20・ユーザー実施): Secrets=`SUPABASE_ACCESS_TOKEN`/`SUPABASE_DB_PASSWORD`(db-migrate 用)、Variables=`APP_URL`(keepalive 用)。CI/CD ファイル(`ci.yml`/`db-migrate.yml`)もコミット `49a2f53` に同梱済み。

**本番での実挙動検証**
- [x] 本番URLで X OAuth 一往復を確認(2026-07-21): ログイン→認可→`/dig` 着地 OK。
- [x] Bluesky 認証の帰り(`/bsky/callback`)一往復を検証(2026-07-21): 本番で「完全移行」成立(全員脱出=青空演出まで確認)。※ 本番は kid 修正後に metadata/jwks 500 が解消して成立。※ ローカル(`127.0.0.1:1963`)も通し確認 — localhost→127.0.0.1 の寄せ(dev ミドルウェア)＋dev サーバー 127.0.0.1 バインド(`--host`)でコールバック接続拒否を解消。
- [ ] keepalive cron が本番で 200 を返すか確認する(**未検証**。Actions で手動 Run。TOP のカウントが出る=`/api/tunnel-count` は生きているので通る見込み)
- [~] モバイル/レスポンシブ確認(2026-07-21): 名簿の長ハンドルが状況列に食い込む崩れを `overflow-wrap:anywhere` で修正・本番実データで解消確認。tunnels 名も予防対策。**ログイン後の操作系(状況select/紐付け/削除)の実機確認は未**。

**SEO・プライバシー**
- [x] サイト全体のインデックス方針を決定(2026-07-20): TOP/about/login は発見のため許可、限定公開の `/t/…` と作成者専用 `/tunnels` はクロール対象外。
- [x] robots.txt を用意(2026-07-20): `Disallow: /t/` + `Disallow: /tunnels`。dev で配信確認済み。
- [~] `/t/[slug]` の `noindex`: robots.txt の Disallow で実質カバー(部屋URLは推測不能・公開リンク無しなのでクローラ到達もほぼ無い)。**厳密な meta `noindex` は @solidjs/meta 追加＋配線が要るため後回し(任意)**。

**コンテンツ・トーン**
- [x] login の「審判」コピー問題を解消(2026-07-20): 該当の `/login` ページごと廃止。X OAuth 失敗は TOP(`/?x_error=…`)で通知する形に統一。唯一のUI露出だった「審判」表現も消え、SPEC「『審判』という語はUIに出さない」とも整合。TOP にエラー文＋リトライ導線を追加、`login.tsx`/`login.module.css` を削除、`x/callback` の失敗先を TOP に変更。dev で `/?x_error=` の表示確認済み。
- [x] 競争寄りのナレーション字幕を見直し(2026-07-20): `pickCaption` の競争色の1行「誰が最初に出るか。そして——誰が最後まで残るか。」を協力的な「先に出た者が、次の手を引く。」に置換。他行は温トーン寄りなので据え置き([[game-is-warm-not-competitive]])。
- [x] `/about` 文言を最終確認(2026-07-20): 免責文の末尾に「ただのお遊びコンテンツです。」を添えるだけの軽い温トーンに(堅い法的文言を脱力させる狙い)。当初は自己申告の不正確さ＋温トーンの段落を足したが説明過多で撤回、一言に集約。dev 目視確認済み。

**リポジトリ整備**
- [x] SiteFooter のロゴを専用の背景入りロゴに確定(2026-07-20)。当初 `ogimage.png`→`logo.svg` に替えたがトンネル青が消えて平板化(私の早計な"是正"ミス)。オーナーが背景入りロゴを用意し差し替え。**方針**: 画面表示はレイヤー重ね(TOPヒーロー=tunnel.png背景＋題字SVGを重ねる。カウントは動的テキストなので焼き込み不可)、焼き込み合成は og:image 専用(`ogimage.png`)、フッターは背景入り単体ロゴ。**アセット名は役割別に整理**(同名拡張子違いの共存を解消): `logo.svg`→`logo-header.svg`(TOPヒーロー題字・透過ベクター)、フッターは `logo-footer.png`(300×240・題字＋トンネル青)。width/height=300×240 でCLS回避。dev で TOPヒーロー＋/about フッターをデスクトップ/モバイル両方、ネットワーク200も確認済み。
- [~] 変更をコミット: 初期一式は `e14a55b`(force-push で1コミットに集約)で本番稼働中。**2026-07-21 の UX/演出/共有バッチ(下記)は staged・未コミット・未デプロイ**。
- [x] README を用意(2026-07-20): 概要(温トーン・非公式)/技術スタック/ローカル開発手順(196x帯・127.0.0.1:1963)/テスト/デプロイ概要/ライセンス(MIT＋源界明朝の謝辞)。日本語。
- [x] LICENSE を用意(2026-07-20): **MIT**(純正テキスト・`Copyright (c) 2026 girigiribauer`)。GitHub のライセンス判定が効くよう本文は改変しない。**画像は全て私物(写真含む)と確認 → コード＋アセット丸ごと MIT でOK**(除外注記は不要)。
- [x] フォント謝辞(2026-07-20): 題字は **源界明朝(フロップデザイン / SIL OFL 1.1)**。フォントファイルは同梱していない(ロゴ画像に使用のみ)ので OFL の再配布条項は不適用・MIT と非衝突。クレジットは任意だが礼儀として `/about` の免責文の下に控えめなリンク(`booth.pm/ja/items/1028548`)を設置。`about.tsx` + `.credit`。dev 目視確認済み。

**ゲーム体験(ゴール)**
- [x] 全員脱出のゴール演出(2026-07-20 完了): 名簿全員が脱獄(migrated/both)のトンネルだけ、字幕エリアを `public/bluesky.png`(青空)に差し替え。判定は `allEscaped` ヘルパー、混在は従来のランダム字幕。`t/[slug].tsx` + `t.module.css`。dev で全員脱出/混在の両分岐を目視確認済み。

**追加のUX・演出・共有(2026-07-21)** ※ すべて staged・未デプロイ
- [x] 共有機能: X intent「𝕏 で仲間に知らせる」(本文 `トンネル: {name} を掘り始めました。`→URL→メンション末尾。@始まりの露出減を避け＋大人数は手動トリム前提)、「テキストをコピー」(同文面)、ゴール時 Bluesky シェア(青空右下・控えめ。`トンネル: {name} を使って、全員地獄から脱出できました！`)。文面は「事実＋トンネル名で引き」方針(世界観は着地ページが担う)。
- [x] FOUC 対策: フッター等の `<A>` クライアント遷移5箇所(index/tunnels/SiteFooter×3)を `<a rel="external">`(フル遷移)化。本番の遷移チラつきは `<A>` の遷移先 CSS 後読みが原因。
- [x] favicon: `public/favicon.png`(トンネル画像 128×128・作者制作)を head に配線。
- [x] レスポンシブ: 名簿ハンドル/トンネル名を `overflow-wrap:anywhere` で折り返し。
- [x] ローディング表示: 状況 select「反映中…」/ 代理「記録中…」/ Bluesky 紐付け「接続中…」。
- [x] TOP ロゴに地震風の小刻み演出: `logoQuake` 1.8s linear・delay 1s・±0.5→±3.5px クレッシェンド→ゆるやか減衰・reduced-motion で無効化。
- [x] ローカル Bluesky 疎通の整理: dev のみ localhost→127.0.0.1 に寄せるミドルウェア(`src/middleware.ts`)を **dev ビルドのみ登録**(`app.config.ts` で `NODE_ENV!==production` 時のみ=本番バンドル非搭載) ＋ dev サーバーを 127.0.0.1 バインド(`package.json` の `--host`)。product に dev 都合を混ぜない。

---

## 残課題(着手前に潰す/後工程に回す)

### 着手前に確認が必要

> **2026-07-18 追記: X関連の"実装着手"は開発順序上あとに回す**(X以外を先行実装)。**X認証自体はリリース仕様として維持**。下記は X OAuth に着手する前に潰す。

- ~~**X Developerアプリの準備**~~ → **完了(2026-07-19)**。器アカウント @xdaidasshutsu で Production アプリ「X大脱出」を新規作成、Client ID/Secret取得、Callback登録済み。
- **X Free tier で `GET /2/users/me` が使えるかの最終確認**: 実装は完了したが、**実アカウントでの一往復検証がまだ**。ここで tier 制限に当たらないか(`users/me` が 200 で返るか)を実ログインで裏取りする。塞がれていた場合は代替案(手入力＋自己申告のみでX認証を省く等)を相談。

### 追加実装(2026-07-19・UI改善以降)

- **残留の取り消し**: 自分/作成者のステータス選択に「収容(保留に戻す)」を追加。残留=self_confirmed ロックの詰みを解消(誤爆救済)。`ADMIN_STATUSES`/`X_ONLY_STATUSES` に not_migrated を含む。
- **作成者向けトンネル一覧 `/tunnels`**: `getMyTunnels`(自分が admin の部屋のみ)+ 各行に「削除」(赤ボタン、`deleteRoom`、作成者本人検証、entries は cascade)。戻りは他ページ同様のロゴフッター。TOP フッター左に「トンネル一覧」(作った部屋がある時だけ)。限定公開の原則は破らない(自分の部屋を自分にだけ)。
- **`/about`(免責)**: 非公式パロディ/各社と無関係/ステータスは自己申告・代理記録で不正確なことがある/仲良く。TOP フッターに薄いリンク。温トーン維持([[game-is-warm-not-competitive]])。
- **テスト**: vitest 導入(`npm test`)。純粋ロジックを実テスト(`status.test`=ハンドル解析、`signedCookie.test`=HMAC署名の改竄検知)。署名ロジックを `signedCookie.ts` に純粋分離。権限・状態遷移の観点は `permissions.todo.test` に `it.todo` で網羅列挙。
- **E2E(Playwright, `npm run test:e2e`)**: X OAuth の往復は対象外とし、**署名セッション Cookie を偽造してログイン状態を注入**(`e2e/helpers.ts`、`.env` の SESSION_SECRET を読む)。dev(1963)+ローカル Supabase 前提(`reuseExistingServer`)。カバー: 掘る検証/名簿・**残留→収容の取り消し(回帰)**・作成者の脱獄代理記録(公開Bluesky API 解決)・トンネル一覧の削除・未ログインの `/dig` リダイレクト。**6本 green**。テストが掘った部屋は `globalTeardown`(e2e_judge が admin の room を直接削除)で毎回後始末し、トンネル総数が走るたびに増えないようにしている。

- **フッター共通化(`SiteFooter`)**: 全ページ+NotFound で共有。非TOPはロゴ(=TOP戻りリンク)を出し、その下にテキストメニュー(トンネル一覧[作った部屋がある時] / 免責事項 / ログアウト[ログイン時])。TOPはロゴ無しでメニューのみ。ロゴとメニューの間隔は flex gap で確保。

### 残っている主な作業(2026-07-19 時点)

- ~~**実 X OAuth 2.0 実装 + 一往復検証**~~ → **完了(2026-07-19)**。開発スタブ撤去→方式Aで差し替え、実アカウント(@xdaidasshutsu)で 認可→`/x/callback`→セッション→`/dig` まで疎通確認済み(Free tier で `users/me` 200 も裏取り)。同時に踏んだ2つの"真っ黒"バグ(server-only の client 漏れ / Solid Router の `<a>` 横取り)も修正済み。
- **Bluesky 実ログインの一往復検証**(callback→行更新。実アカウント + `127.0.0.1:1963` で)
- ~~**UI改善タスク(下記「UI改善リスト」参照)**~~ → **完了(2026-07-19)**。全ページ inline style を CSS Modules へ分離、マージンを margin-bottom に統一。
- **デプロイ**(Vercel + 本番Supabaseプロジェクト + env)、OGP絶対URL化・Bluesky本番メタデータ・cron の `APP_URL` 設定
- **git コミット/整備、テスト整備**(認証・権限まわりは回帰が怖い)
- 全員脱出時のお祝い演出(字幕→青空)、その他ビジュアル微調整
- ※ ロゴ/OGP/囚人シルエット等のビジュアルは実装済み(オーナー自作)。行の自動一致もハンドル照合で実装済み。

### UI改善リスト(2026-07-19 オーナー指摘・**全項目完了**)

> 実装方針: 全ページ inline style → **CSS Modules(ページ別 `*.module.css`)** へ分離。ハンドル解析(URL/@有無/重複)は `status.ts` の `parseHandlesInput` に共通化し client/server 両用。
>
> **マージン規律**: ブロックは**外部マージンを持たない**。ブロック間の余白は必ず**"親"が所有**する(`.main` を `display:flex; flex-direction:column; gap:…` にして gap で与える)。→ どのブロックをコンポーネントに切り出しても、外部マージンが付いてこない=常に正しい(隣に何かある前提を持たない)。内部の余白は padding/border(コンポーネント内部の構成)で持つ。ページの器(`.main`)だけ中央寄せの `margin: auto` を許す。`margin-top` や上下混在は使わない。**全ページ適用済み(2026-07-19: /t /dig /login /TOP)**。**例外: スティッキーフッター**(2026-07-20)。`#app` を flex 縦＋`min-height:100dvh`、`main` を `flex:1 0 auto` で伸ばし、`SiteFooter .footer` に `margin-top:auto`(下端寄せ)＋`padding-top`(本文と詰まらない最低間隔)。コンテンツが短いページでフッターが浮いて本文と近づく問題への対処で、規律上の `margin` 例外はこの1箇所に限定。**落とし穴**: `main` が flex 子になると `.main` の左右 `auto` マージン(中央寄せ)が flex の stretch を打ち消し、内容が短いページで max-width まで広がらず縮む(例: /tunnels の空状態が 373px に)。対策として `main` に `width:100%; box-sizing:border-box` を付け、内容に関わらず器幅→max-width で頭打ち→中央寄せを保つ。この結果 max-width(46rem)は border-box 基準になり、全ページ内容幅は 46rem で統一。一体で見せたい塊は wrapper で束ねて内部に gap を入れない(例: /t の header+caption = `.masthead`)。flex で stretch させたくない子は `align-self: flex-start`(例: /login のボタン)。

**確定事項(この回で決めたもの)**:
- 「掘る」は**他1人以上を必須**(審判=自分だけ/空では掘れない)。有効な仲間が0人ならボタン無効化。
- 掘るボタンのラベルは**自分を含む合計人数**を動的表示(例: 有効な仲間3人 → 「4人でトンネルを掘る」)。
- 状態変更UIは**プルダウン(select)**にする。選択肢から**収容(not_migrated)は除外**(現状維持=変更先にならない)。

**`/dig`(トンネルを掘る)**:
1. 「あなたが審判となり…」等の審判説明文を削除。
2. ログイン/ログアウトUIを画面途中から撤去 → 下部などへ。
3. 空/自分だけでの送信を防止(上記・他1人以上必須)。
4. ボタンラベルに合計人数を可視化(上記)。
5. 複数行テキストエリアの視認性向上(枠・背景・コントラスト)。

**`/t/[slug]`(トンネルページ)** — 操作は名簿の各行にインライン内包(当初「下部の分離パネル」にしたが違和感があり、行内へ戻した):
1. ViewerBar(上部のデカい枠+「あなた:@xxx」)を撤去。未ログインは細い1行のログイン導線、ログアウトは最下部で文言は「ログアウト」(@handle は出さない)。
2. **自分の操作と作成者の操作は場所ごと分離**する(概念が別物なので)。**自分の状態申告**「アクション: [プルダウン]」(残留 / 脱獄2種、収容は除外)は、自分のアイデンティティの並び=**名前(@handle / Bluesky が出る所)の隣**に置く(自分が「移った」と宣言する行為だから)。脱獄選択時のみ**その行の2段目**に Bluesky 紐付け欄。一方、作成者が他人を変える ▾ は下記3の通り**状況(右)の隣**に置く。
3. **他人の行**は、作成者(=ルーム作成者)だけに状況の左隣に **▾ アイコン**が出て、クリックでメニュー(残留 / 脱獄2種)→ 代理でステータス変更。脱獄を選んだ場合は**当人の Bluesky ハンドルを作成者が入力**して代理記録する(当人ログイン不要 = **未検証の追認**。公開getProfileで実在確認しdid/handleを保存、self_confirmed=false のまま。後で当人が本人ログインすれば確定=self_confirmed に昇格)。本人確定済みの行には ▾ を出さない。**未検証の追認と本人確認済みは見た目で区別しない**(内部の self_confirmed のみ)。
4. 下部の操作パネルと末尾の注記テキストは無し。「審判」という語はUIに出さない。
5. 状態選択はプルダウン/メニュー。収容(not_migrated)は変更先の選択肢から除外。プルダウンのプレースホルダ option は `disabled` にしない(disabled だと収容時に先頭の有効 option=残留に誤フォールバックするため、`value=""` の選べる option にする)。
6. **共有ブロックを名簿の下にひとまとめ**: 注意書き(元はヘッダー) + read-only の URL 表示 + 「URLをコピー」ボタン + 控える案内。限定公開で URL を失うと辿れないため。URL は遷移直後の `location.pathname` が前ページを指す事があるので **slug から `${origin}/t/${slug}` で確定的に組む**(mount 後)。
7. **キャプション(字幕)を"バナー"化**: 上下 3rem の padding + 下ボーダー(ヘッダーと同じ `2px solid var(--rule)`)。ヘッダー下の罫線と挟んで劇画タイトルカード風に。

**TOP**:
1. ログイン後、ボタン直下にテキストでログアウト導線を用意。
