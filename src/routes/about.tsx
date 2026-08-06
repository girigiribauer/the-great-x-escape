import SiteFooter from "~/components/SiteFooter";
import styles from "./about.module.css";

export default function About() {
  return (
    <main class={styles.main}>
      <header class={styles.header}>
        <p class={styles.eyebrow}>ABOUT</p>
        <h1 class={styles.title}>このサイトについて</h1>
      </header>

      <section class={styles.section}>
        <h2 class={styles.h2}>X大脱出とは</h2>
        <p class={styles.p}>
          X (旧 Twitter) から Bluesky への引っ越しを、仲間内でゆるく見守り合うためのお遊びサービスです。
          「誰がまだ残っているか」を名簿にして、責めるためではなく、
          <strong class={styles.em}>一緒に移ろうと声をかけ合うきっかけ</strong>にするための道具です。
        </p>
        <p class={styles.p}>
          映画『大脱走』になぞらえて、名簿ページを作ることを「トンネルを掘る」、Bluesky へ移ることを「脱獄」と呼んでいます。
          物騒な言葉づかいはあくまでパロディで、X を攻撃したり、誰かを晒したりする目的はありません。
        </p>
      </section>

      <section class={styles.section}>
        <h2 class={styles.h2}>名簿は限定公開です</h2>
        <p class={styles.p}>
          作られた名簿(トンネル)は、推測できないランダムな URL でのみ開けます。
          トップページに出しているのは本数だけで、名簿の中身・URL・一覧はどこにも公開していません。
          URL を知っている仲間内だけが見られます。
        </p>
        <p class={styles.p}>
          名簿に誰かを載せるときは、ひとこと声をかけてからにするのがおすすめです。驚かせないために。
        </p>
      </section>

      <section class={styles.section}>
        <h2 class={styles.h2}>ログインで集めているもの / 集めていないもの</h2>
        <p class={styles.p}>
          本人確認のために X と Bluesky のログイン (OAuth) を使います。どちらも
          <strong class={styles.em}>「そのアカウントの本人か」を確かめるためだけ</strong>に使い、
          必要最小限の情報しか受け取りません。
        </p>
        <ul class={styles.list}>
          <li>
            <strong>X</strong> ── あなたのユーザー ID とハンドルの取得だけを行います。
            投稿の閲覧・取得・検索や、あなたの代わりの投稿はしません。
            アクセストークンは保存しません(本人確認が済んだら破棄します)。
          </li>
          <li>
            <strong>Bluesky</strong> ── 「移った / 両方使っている」と申告するときだけログインし、
            ハンドルの紐付けに使います。
          </li>
          <li>
            <strong>保存するもの</strong> ── 名簿に必要な範囲(X ハンドル、確認できた場合の ID、
            Bluesky ハンドル、いまの状況)と、Bluesky のログイン状態を保つための認証情報です。
            パスワードをお預かりすることはありません。
          </li>
        </ul>
      </section>

      <section class={styles.section}>
        <h2 class={styles.h2}>正確さについて</h2>
        <p class={styles.p}>
          各人の状況は、本人の自己申告か、名簿の作成者による代理記録で成り立っています。
          まちがいや古い情報が含まれることがあります。仲間内で楽しむ前提の、ゆるいサービスとしてお使いください。
        </p>
      </section>

      <section class={styles.section}>
        <h2 class={styles.h2}>免責</h2>
        <p class={styles.p}>
          「X大脱出」は個人が運営する非公式のサービスです。X (旧 Twitter) / X Corp / Bluesky
          およびその関連会社とは一切関係がなく、各社の名称・商標はそれぞれの権利者に帰属します。
        </p>
        <p class={styles.p}>
          本サービスのご利用によって生じたいかなる損害についても、運営者は一切の責任を負いかねます。ただのお遊びコンテンツです。
        </p>
      </section>

      <p class={styles.credit}>
        題字フォント：
        <a href="https://booth.pm/ja/items/1028548" target="_blank" rel="noopener noreferrer">
          源界明朝
        </a>
        （フロップデザイン）
      </p>

      <SiteFooter showLogo />
    </main>
  );
}
