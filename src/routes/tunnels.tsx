import { A, createAsync, Navigate, useAction, useSubmission } from "@solidjs/router";
import { createSignal, For, Show, Suspense } from "solid-js";
import SiteFooter from "~/components/SiteFooter";
import { deleteRoom, getMyTunnels } from "~/lib/rooms";
import { getXIdentity } from "~/lib/xIdentity";
import styles from "./tunnels.module.css";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

export default function Tunnels() {
  const identity = createAsync(() => getXIdentity());
  const tunnels = createAsync(() => getMyTunnels());
  const doDelete = useAction(deleteRoom);
  const delSub = useSubmission(deleteRoom);
  const [confirming, setConfirming] = createSignal<string | null>(null);

  return (
    <main class={styles.main}>
      <Show when={identity() !== undefined}>
        <Show when={identity()} fallback={<Navigate href="/" />}>
          <header class={styles.header}>
            <p class={styles.eyebrow}>YOUR TUNNELS</p>
            <h1 class={styles.title}>あなたが掘ったトンネル</h1>
          </header>

          <Suspense fallback={<p class={styles.empty}>探している…</p>}>
            <Show
              when={(tunnels()?.length ?? 0) > 0}
              fallback={<p class={styles.empty}>まだトンネルを掘っていません。</p>}
            >
              <ul class={styles.list}>
                <For each={tunnels()}>
                  {(t) => (
                    <li class={styles.row}>
                      <A href={`/t/${t.slug}`} class={styles.rowLink}>
                        <span class={styles.tName}>{t.tunnelName}</span>
                        <span class={styles.tMeta}>{t.memberCount}名 ・ {fmtDate(t.createdAt)}</span>
                      </A>
                      <Show
                        when={confirming() === t.slug}
                        fallback={
                          <button type="button" class={styles.delBtn} onClick={() => setConfirming(t.slug)}>
                            削除
                          </button>
                        }
                      >
                        <span class={styles.confirmText}>本当に消していいですか？</span>
                        <button
                          type="button"
                          class={styles.dangerBtn}
                          disabled={delSub.pending}
                          onClick={async () => {
                            await doDelete(t.slug);
                            setConfirming(null);
                          }}
                        >
                          消す
                        </button>
                        <button type="button" class={styles.cancelBtn} onClick={() => setConfirming(null)}>
                          やめる
                        </button>
                      </Show>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </Suspense>

          <Show when={delSub.result instanceof Error}>
            <p class={styles.error}>{(delSub.result as Error).message}</p>
          </Show>

          <SiteFooter showLogo />
        </Show>
      </Show>
    </main>
  );
}
