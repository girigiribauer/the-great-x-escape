import { A, createAsync, useSearchParams } from "@solidjs/router";
import { createSignal, onMount, Show, Suspense } from "solid-js";
import SiteFooter from "~/components/SiteFooter";
import { getTunnelCount } from "~/lib/rooms";
import { getXIdentity } from "~/lib/xIdentity";
import styles from "./index.module.css";

export default function Home() {
  const count = createAsync(() => getTunnelCount());
  const identity = createAsync(() => getXIdentity());
  // X OAuth 失敗時は /?x_error=… でここへ戻ってくる(TOP がログイン入口を兼ねる)。
  // メッセージは signal に退避し、マウント後にクエリを URL から掃除する(共有・リロードで汚さない)。
  const [params] = useSearchParams();
  const [loginError, setLoginError] = createSignal(params.x_error ? String(params.x_error) : null);
  onMount(() => {
    if (params.x_error) {
      window.history.replaceState(window.history.state, "", window.location.pathname);
    }
  });

  return (
    <main class={styles.main}>
      <header class={styles.hero}>
        <img src="/tunnel.png" alt="" width="1600" height="900" class={styles.heroImg} />
        <div class={styles.heroScrim} />
        <h1 class={styles.heroTitle}>
          <img
            src="/logo-header.svg"
            alt="X大脱出 — The Great X Escape"
            width="300"
            height="160"
            class={styles.heroLogo}
          />
        </h1>

        <p class={styles.heroCount}>
          これまでに掘られたトンネル:{" "}
          <Suspense fallback={<span class={styles.countLoading}>数えている…</span>}>
            <Show when={count() !== undefined}>
              <strong class={styles.countNum}>{count()}</strong> 本
            </Show>
          </Suspense>
        </p>
      </header>

      <p class={styles.lead}>
        どこかにある『X』という名の地獄の収容所。
        <br />
        そこに囚われている囚人たちは不平・不満を言いつつも強制労働に従事させられていた。
        <br />
        だが、このままではいけないと、仲間と示し合わせてトンネルを掘る。
        <br />
        かつて見た、青い鳥が羽ばたけるような自由な青空を目指して───
      </p>

      <div class={styles.cta}>
        <Show when={loginError()}>
          <p class={styles.error}>
            ログインに失敗しました(理由: {loginError()})。もう一度お試しください。
          </p>
        </Show>
        <Suspense>
          <Show
            when={identity()}
            fallback={
              // rel=external で素の <a> にする(Solid Router の横取りを避け、サーバールートへ全画面遷移させる)。
              <a href="/x/login?redirectTo=/dig" rel="external" class={styles.ctaBtn}>Xでログインしてトンネルを掘る</a>
            }
          >
            <A href="/dig" class={styles.ctaBtn}>トンネルを掘る</A>
          </Show>
        </Suspense>
      </div>

      <SiteFooter />
    </main>
  );
}
