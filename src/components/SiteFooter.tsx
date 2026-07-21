import { createAsync } from "@solidjs/router";
import { Show } from "solid-js";
import { getMyTunnels } from "~/lib/rooms";
import { getXIdentity, xLogout } from "~/lib/xIdentity";
import styles from "./SiteFooter.module.css";

export default function SiteFooter(props: { showLogo?: boolean }) {
  const identity = createAsync(() => getXIdentity());
  const tunnels = createAsync(() => getMyTunnels());
  return (
    <footer class={styles.footer}>
      <Show when={props.showLogo}>
        <a href="/" rel="external" aria-label="X大脱出 トップへ戻る" class={styles.logo}>
          <img src="/logo-footer.png" alt="" width="300" height="240" class={styles.logoImg} />
        </a>
      </Show>
      <nav class={styles.links}>
        <Show when={(tunnels()?.length ?? 0) > 0}>
          <a href="/tunnels" rel="external" class={styles.link}>トンネル一覧</a>
        </Show>
        <a href="/about" rel="external" class={styles.link}>免責事項</a>
        <Show when={identity()}>
          <form action={xLogout} method="post">
            <button type="submit" class={styles.link}>ログアウト</button>
          </form>
        </Show>
      </nav>
    </footer>
  );
}
