import SiteFooter from "~/components/SiteFooter";
import styles from "./about.module.css";

export default function About() {
  return (
    <main class={styles.main}>
      <header class={styles.header}>
        <p class={styles.eyebrow}>ABOUT</p>
        <h1 class={styles.title}>このサイトについて</h1>
      </header>

      <p class={styles.p}>
        「X大脱出」は個人が運営する非公式のサービスです。X (旧 Twitter) / X Corp / Bluesky およびその関連会社とは
        一切関係がなく、各社の名称・商標はそれぞれの権利者に帰属します。
      </p>

      <p class={styles.p}>
        本サービスのご利用によって生じたいかなる損害についても、運営者は一切の責任を負いかねます。ただのお遊びコンテンツです。
      </p>

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
