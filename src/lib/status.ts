/**
 * ステータス4値の定義と表示ラベル(SPEC「ステータス(4値)」)。
 * DB の enum `entry_status` と一致させること。
 */

export const STATUSES = ["not_migrated", "both", "migrated", "stayed"] as const;

export type Status = (typeof STATUSES)[number];

/** 劇画調トーンをベースにした日本語ラベル */
export const STATUS_LABEL: Record<Status, string> = {
  not_migrated: "収容",
  both: "脱獄（両方運用中）",
  migrated: "脱獄（完全移行）",
  stayed: "残留",
};

/** X ハンドルの正規化: 先頭 @ を除き小文字化。重複判定・保存に使う。 */
export function normalizeXHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}

/** X ハンドルの妥当性(英数と _、1〜15文字。Xの仕様に準拠) */
export function isValidXHandle(handle: string): boolean {
  return /^[a-z0-9_]{1,15}$/.test(handle);
}

// クライアント(/dig の人数カウント)とサーバー(digTunnel)で共用するためここに置く。
export function extractHandle(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  const m = s.match(/(?:x\.com|twitter\.com)\/(?:#!\/)?@?([A-Za-z0-9_]+)/i);
  if (m) s = m[1]!;
  const h = normalizeXHandle(s);
  return isValidXHandle(h) ? h : null;
}

// exclude は最初から seen 扱いにするハンドル(審判自身を除外する用途)。
export function parseHandlesInput(text: string, exclude: string[] = []): string[] {
  const seen = new Set(exclude.map(normalizeXHandle));
  const out: string[] = [];
  for (const tok of text.split(/[\n,]+/)) {
    const h = extractHandle(tok);
    if (!h || seen.has(h)) continue;
    seen.add(h);
    out.push(h);
  }
  return out;
}
