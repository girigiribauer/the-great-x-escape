import { createAsync, Navigate, useSubmission } from "@solidjs/router";
import { createMemo, createSignal, Show } from "solid-js";
import SiteFooter from "~/components/SiteFooter";
import { digTunnel } from "~/lib/createRoom";
import { parseHandlesInput } from "~/lib/status";
import { getXIdentity } from "~/lib/xIdentity";
import styles from "./dig.module.css";

export default function Dig() {
  const identity = createAsync(() => getXIdentity());
  const digSub = useSubmission(digTunnel);
  const [text, setText] = createSignal("");

  return (
    <Show when={identity() !== undefined}>
      <Show when={identity()} fallback={<Navigate href="/" />}>
        {(id) => {
          const others = createMemo(() => parseHandlesInput(text(), [id().handle]));
          const total = () => others().length + 1;
          const canDig = () => others().length > 0 && !digSub.pending;

          return (
            <main class={styles.main}>
              <header class={styles.header}>
                <p class={styles.eyebrow}>DIG A TUNNEL</p>
                <h1 class={styles.title}>トンネルを掘る</h1>
              </header>

              <form action={digTunnel} method="post">
                <div class={styles.field}>
                  <label class={styles.label} for="handles">
                    一緒にトンネルを掘る仲間をここに貼り付け（複数可）
                  </label>
                  <textarea
                    id="handles"
                    name="handles"
                    rows={6}
                    class={styles.textarea}
                    placeholder={
                      "@あり/なしのハンドルでも、プロフィールURLでもOK。改行かカンマ区切りで複数。\n例:\n@nakama_a\nhttps://x.com/nakama_b\nmayoi_c"
                    }
                    value={text()}
                    onInput={(e) => setText(e.currentTarget.value)}
                  />
                </div>

                <div class={styles.submitWrap}>
                  <button type="submit" class={styles.submit} disabled={!canDig()}>
                    {digSub.pending
                      ? "掘っている…"
                      : others().length === 0
                        ? "見届ける仲間を1人以上入れてください"
                        : `${total()}人でトンネルを掘る`}
                  </button>
                </div>

                <Show when={digSub.result instanceof Error}>
                  <p class={styles.error}>{(digSub.result as Error).message}</p>
                </Show>
              </form>

              <SiteFooter showLogo />
            </main>
          );
        }}
      </Show>
    </Show>
  );
}
