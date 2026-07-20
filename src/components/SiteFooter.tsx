import { A, createAsync } from "@solidjs/router";
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
        <A href="/" aria-label="X大脱出 トップへ戻る" class={styles.logo}>
          <img src="/logo-footer.png" alt="" width="300" height="240" class={styles.logoImg} />
        </A>
      </Show>
      <nav class={styles.links}>
        <Show when={(tunnels()?.length ?? 0) > 0}>
          <A href="/tunnels" class={styles.link}>トンネル一覧</A>
        </Show>
        <A href="/about" class={styles.link}>免責事項</A>
        <Show when={identity()}>
          <form action={xLogout} method="post">
            <button type="submit" class={styles.link}>ログアウト</button>
          </form>
        </Show>
      </nav>
    </footer>
  );
}
