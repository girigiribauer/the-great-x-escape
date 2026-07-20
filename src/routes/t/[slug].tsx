import { createAsync, useAction, useParams, useSubmission } from "@solidjs/router";
import { createMemo, createSignal, For, onMount, Show, Suspense } from "solid-js";
import SiteFooter from "~/components/SiteFooter";
import { getRoom, type RosterEntry } from "~/lib/rooms";
import { normalizeXHandle, STATUS_LABEL, type Status } from "~/lib/status";
import { adminSetStatus, setMyStatus } from "~/lib/statusActions";
import { getXIdentity } from "~/lib/xIdentity";
import styles from "./t.module.css";

// stayed が label-not-migrated を使う等、status と svg 名は一致しないので明示する。
const STATUS_LABEL_SVG: Record<Status, { src: string; suffix?: string }> = {
  stayed: { src: "/label-not-migrated.svg" },
  not_migrated: { src: "/label-unverified.svg" },
  migrated: { src: "/label-migrated.svg", suffix: "完全移行" },
  both: { src: "/label-migrated.svg", suffix: "両方運用中" },
};

function StatusBadge(props: { status: Status }) {
  const m = () => STATUS_LABEL_SVG[props.status];
  return (
    <span class={styles.badge}>
      <img src={m().src} alt={STATUS_LABEL[props.status]} height="39" class={styles.badgeImg} />
      <Show when={m().suffix}>
        <span class={styles.badgeSuffix}>{m().suffix}</span>
      </Show>
    </span>
  );
}

function MemberIcon(props: { avatarUrl: string | null; no: string }) {
  return (
    <div class={styles.icon}>
      <Show
        when={props.avatarUrl}
        fallback={<img src="/icon-user.svg" alt="" width="80" height="80" class={styles.iconImg} />}
      >
        <img src={props.avatarUrl!} alt="" width="80" height="80" class={styles.iconImg} />
      </Show>
      <span class={styles.iconNo}>{props.no}</span>
    </div>
  );
}

function AdminMenu(props: { disabled: boolean; onPick: (status: Status) => void }) {
  const [open, setOpen] = createSignal(false);
  const pick = (s: Status) => {
    props.onPick(s);
    setOpen(false);
  };
  return (
    <span class={styles.menuWrap}>
      <button
        type="button"
        class={styles.trigger}
        disabled={props.disabled}
        aria-label="状態を変更"
        aria-expanded={open()}
        onClick={() => setOpen((o) => !o)}
      >
        ▾
      </button>
      <Show when={open()}>
        <div class={styles.menuBackdrop} onClick={() => setOpen(false)} />
        <div class={styles.menu}>
          <button type="button" class={styles.menuItem} onClick={() => pick("not_migrated")}>{STATUS_LABEL.not_migrated}（保留に戻す）</button>
          <button type="button" class={styles.menuItem} onClick={() => pick("stayed")}>{STATUS_LABEL.stayed}</button>
          <button type="button" class={styles.menuItem} onClick={() => pick("migrated")}>{STATUS_LABEL.migrated}</button>
          <button type="button" class={styles.menuItem} onClick={() => pick("both")}>{STATUS_LABEL.both}</button>
        </div>
      </Show>
    </span>
  );
}

function MemberRow(props: {
  entry: RosterEntry;
  index: number;
  isMine: boolean;
  canAdminEdit: boolean;
  busy: boolean;
  slug: string;
  selfValue: string;
  migrateTarget: "migrated" | "both" | null;
  onSelfSelect: (value: string) => void;
  onAdmin: (status: Status, blueskyHandle?: string) => void;
}) {
  const e = () => props.entry;
  const no = () => String(props.index + 1).padStart(3, "0");
  const escaped = () => e().status === "migrated" || e().status === "both";

  const [attestTarget, setAttestTarget] = createSignal<"migrated" | "both" | null>(null);
  const [attestHandle, setAttestHandle] = createSignal("");
  const onAdminPick = (status: Status) => {
    if (status === "not_migrated" || status === "stayed") {
      setAttestTarget(null);
      props.onAdmin(status);
    } else if (status === "migrated" || status === "both") {
      setAttestTarget(status);
    }
  };
  const submitAttest = () => {
    const t = attestTarget();
    if (!t || !attestHandle().trim()) return;
    props.onAdmin(t, attestHandle());
    setAttestTarget(null);
    setAttestHandle("");
  };

  return (
    <div class={`${styles.row}${props.isMine ? ` ${styles.rowMine}` : ""}`}>
      <div class={styles.rowMain}>
        <MemberIcon avatarUrl={e().avatarUrl} no={no()} />
        <div class={styles.nameCell}>
          <a href={`https://x.com/${e().xHandle}`} target="_blank" rel="noopener noreferrer" class={escaped() ? styles.xlinkEscaped : styles.xlink}>
            @{e().xHandle}
          </a>
          <Show when={e().blueskyHandle}>
            <a href={`https://bsky.app/profile/${e().blueskyHandle}`} target="_blank" rel="noopener noreferrer" class={styles.bskylink}>
              @{e().blueskyHandle}
            </a>
          </Show>
          <Show when={props.isMine}>
            <span class={styles.youBadge}>あなた</span>
            <span class={styles.selfControl}>
              <select
                class={styles.inlineSelect}
                disabled={props.busy}
                autocomplete="off"
                value={props.selfValue}
                onChange={(ev) => props.onSelfSelect(ev.currentTarget.value)}
              >
                <option value="">選ぶ…</option>
                <option value="not_migrated">{STATUS_LABEL.not_migrated}（保留に戻す）</option>
                <option value="stayed">{STATUS_LABEL.stayed}</option>
                <option value="migrated">{STATUS_LABEL.migrated}</option>
                <option value="both">{STATUS_LABEL.both}</option>
              </select>
            </span>
          </Show>
        </div>
        <div class={styles.controls}>
          <Show when={props.canAdminEdit}>
            <AdminMenu disabled={props.busy} onPick={onAdminPick} />
          </Show>
          <StatusBadge status={e().status} />
        </div>
      </div>

      <Show when={props.isMine && props.migrateTarget}>
        <form action="/bsky/login" method="get" class={styles.bskyLine}>
          <input type="hidden" name="entryId" value={e().id} />
          <input type="hidden" name="slug" value={props.slug} />
          <input type="hidden" name="status" value={props.migrateTarget!} />
          <span class={styles.bskyNote}>🦋 {STATUS_LABEL[props.migrateTarget!]} には Bluesky で紐付け:</span>
          <input name="handle" placeholder="your.bsky.social" autocomplete="off" class={styles.bskyInput} />
          <button type="submit" class={styles.bskyBtn}>紐付けて確定</button>
        </form>
      </Show>

      <Show when={attestTarget()}>
        <div class={styles.bskyLine}>
          <span class={styles.bskyNote}>🦋 {STATUS_LABEL[attestTarget()!]}(代理記録)— 当人の Bluesky ハンドル:</span>
          <input
            placeholder="their.bsky.social"
            autocomplete="off"
            class={styles.bskyInput}
            value={attestHandle()}
            onInput={(ev) => setAttestHandle(ev.currentTarget.value)}
          />
          <button type="button" class={styles.bskyBtn} disabled={props.busy || !attestHandle().trim()} onClick={submitAttest}>
            記録する
          </button>
        </div>
      </Show>
    </div>
  );
}

// 実映画のセリフは引用しない(オリジナル文言のみ)。seed でサーバー/クライアント一致させて選ぶ。
function pickCaption(roster: RosterEntry[], seed: number): string {
  const stuck = roster.filter((e) => e.status === "not_migrated").length;
  const out = roster.filter((e) => e.status === "migrated" || e.status === "both").length;
  const stayed = roster.filter((e) => e.status === "stayed").length;

  const lines: string[] = [
    "トンネルは掘られた。あとは、抜け出すだけだ。",
    "壁の向こうに、自由がある。",
    "先に出た者が、次の手を引く。",
    "合図を待て。焦るな。だが、ためらうな。",
    "この夜が明ければ、また一人、消える。",
    "250人を、この壁の外へ。",
    "独房の壁に、ボールを投げ続ける。",
    "鉄条網の向こうへ、跳んでみせる。",
    "掘る者、贋作屋、調達屋。役者は揃った。",
    "全員は無理でも、それでも掘る。",
  ];
  if (stuck > 0) {
    lines.push(`まだ ${stuck}人が、壁の内側にいる。——早く、抜け出せ。`);
    lines.push(`残るは ${stuck}人。夜明けは近い。`);
    lines.push(`${stuck}人、まだ動かず。`);
  }
  if (out > 0) lines.push(`${out}人が、地上の風を吸った。`);
  if (out > 0 && stuck > 0) lines.push(`${out}人が抜け、${stuck}人が壁の中に残っている。`);
  if (stayed > 0) lines.push(`${stayed}人は、この壁の中に残ることを選んだ。`);
  if (stuck === 0) lines.push("全員が、己の道を選んだ。もう、迷う者はいない。");

  return lines[Math.floor(seed * lines.length)] ?? lines[0]!;
}

// 全員脱出 = 名簿の全員が脱獄(migrated/both)。残留や未移行が1人でもいれば未達。
// これがこのゲームのゴール。達成トンネルだけ字幕の代わりにお祝い画像を出す。
function allEscaped(roster: RosterEntry[]): boolean {
  return roster.length > 0 && roster.every((e) => e.status === "migrated" || e.status === "both");
}

export default function Room() {
  const params = useParams();
  const room = createAsync(() => getRoom(params.slug ?? ""));
  const identity = createAsync(() => getXIdentity());

  const doSelf = useAction(setMyStatus);
  const doAdmin = useAction(adminSetStatus);
  const selfSub = useSubmission(setMyStatus);
  const adminSub = useSubmission(adminSetStatus);
  const busy = () => Boolean(selfSub.pending || adminSub.pending);

  const myHandle = () => identity()?.handle ?? null;
  const adminHandle = createMemo(() => {
    const r = room();
    if (!r) return null;
    const a = r.roster.find((e) => e.isAdmin);
    return a ? normalizeXHandle(a.xHandle) : null;
  });
  const viewerIsAdmin = () => !!myHandle() && myHandle() === adminHandle();
  const myEntryId = createMemo(() => {
    const r = room();
    const h = myHandle();
    if (!r || !h) return null;
    return r.roster.find((e) => normalizeXHandle(e.xHandle) === h)?.id ?? null;
  });

  const [migrateTarget, setMigrateTarget] = createSignal<"migrated" | "both" | null>(null);
  const onSelfSelect = (value: string) => {
    const id = myEntryId();
    if (!id) return;
    if (value === "not_migrated" || value === "stayed") {
      setMigrateTarget(null);
      doSelf(id, value);
    } else if (value === "migrated" || value === "both") {
      setMigrateTarget(value);
    }
  };
  const selfValueFor = (e: RosterEntry) =>
    e.status === "stayed" || e.status === "migrated" || e.status === "both" ? e.status : "";

  // 遷移直後の window.location.pathname は前ページを指すことがあるため、slug から確定的に組む。
  const [mounted, setMounted] = createSignal(false);
  const [copied, setCopied] = createSignal(false);
  onMount(() => setMounted(true));
  const shareUrl = () => (mounted() ? `${window.location.origin}/t/${params.slug ?? ""}` : "");
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // 失敗時は onFocus の全選択による手動コピーに委ねる。
    }
  };

  return (
    <main class={styles.main}>
      <Suspense fallback={<p class={styles.loading}>トンネルを確認している…</p>}>
        <Show
          when={room()}
          fallback={
            <div>
              <h1 class={styles.notFoundTitle}>このトンネルは見つからない</h1>
              <p class={styles.notFoundBody}>
                URLが違うか、まだ掘られていないか、あるいは既に埋め戻されたのかもしれない。
              </p>
            </div>
          }
        >
          {(r) => (
            <>
              {/* header+caption を束ねて間に gap を入れない(キャプションの padding で間隔を持たせるため)。 */}
              <div class={styles.masthead}>
                <header class={styles.header}>
                  <div class={styles.headerTop}>
                    <h1 class={styles.tunnelName}>
                      <img src="/icon-tunnel.png" alt="" width="44" height="44" class={styles.tunnelIcon} />
                      {r().tunnelName}
                    </h1>
                    <p class={styles.count}>{r().roster.length}名がこのトンネルに関わっている</p>
                  </div>
                </header>
                <Show
                  when={allEscaped(r().roster)}
                  fallback={<p class={styles.caption}>{pickCaption(r().roster, r().captionSeed)}</p>}
                >
                  {/* ゴール到達: 全員が青い空へ。字幕の代わりにお祝い画像。 */}
                  <div class={styles.escapeCard}>
                    <img
                      src="/bluesky.png"
                      alt="全員が壁を越え、青い空へ羽ばたいた"
                      width="1600"
                      height="600"
                      class={styles.escapeImage}
                    />
                  </div>
                </Show>
              </div>

              <Show when={!myHandle()}>
                <div class={styles.loginPrompt}>
                  <span>自分の状態を申告するには X ログイン:</span>
                  <a href={`/x/login?redirectTo=/t/${params.slug}`} rel="external" class={styles.loginLink}>
                    𝕏 でログイン
                  </a>
                </div>
              </Show>

              <div>
                <div class={styles.listHead}>
                  <div class={styles.listHeadNo}>囚人No.</div>
                  <div class={styles.listHeadName}>囚人名</div>
                  <div class={styles.listHeadStatus}>状況</div>
                </div>
                <For each={r().roster}>
                  {(entry, index) => {
                    const isMine = () => !!myHandle() && normalizeXHandle(entry.xHandle) === myHandle();
                    const canAdminEdit = () => viewerIsAdmin() && !isMine() && !entry.selfConfirmed;
                    return (
                      <MemberRow
                        entry={entry}
                        index={index()}
                        isMine={isMine()}
                        canAdminEdit={canAdminEdit()}
                        busy={busy()}
                        slug={params.slug ?? ""}
                        selfValue={selfValueFor(entry)}
                        migrateTarget={migrateTarget()}
                        onSelfSelect={onSelfSelect}
                        onAdmin={(status, handle) => doAdmin(entry.id, status, handle)}
                      />
                    );
                  }}
                </For>
              </div>

              <Show when={selfSub.result instanceof Error || adminSub.result instanceof Error}>
                <p class={styles.error}>{((selfSub.result ?? adminSub.result) as Error).message}</p>
              </Show>

              <div class={styles.shareBlock}>
                <p class={styles.shareNote}>
                  ※ このトンネルは、URLを知っている仲間だけが出入りできます。どこでどうシェアするかは、あなたにお任せします。
                </p>
                <div class={styles.urlRow}>
                  <input
                    class={styles.urlInput}
                    type="text"
                    readonly
                    value={shareUrl()}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <button type="button" class={styles.copyBtn} onClick={copyUrl}>
                    {copied() ? "コピーしました" : "URLをコピー"}
                  </button>
                </div>
                <p class={styles.shareWarn}>
                  ※ このURLは一覧に出ません(限定公開)。閉じると辿れなくなるので、どこかに控えておいてください。
                </p>
              </div>

            </>
          )}
        </Show>
      </Suspense>
      <SiteFooter showLogo />
    </main>
  );
}
