/**
 * トンネル(ルーム)の識別子生成。
 *
 * - slug        … アクセスURL用の推測不能なランダム文字列(表示名とは無関係)
 * - tunnelName  … 表示用トンネル名。映画『大脱走』の脱出トンネル Tom/Dick/Harry
 *                 + 3桁の乱数(例: Tom123, Dick357, Harry042)
 *
 * SPEC: トンネル名は表示専用で、アクセスURL(slug)とは無関係にすること。
 */

const TUNNEL_NAMES = ["Tom", "Dick", "Harry"] as const;

// URL slug に使う文字集合。紛らわしい文字(0/O, 1/l/I)を除いた base32 風。
const SLUG_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const SLUG_LENGTH = 22; // ~110bit 相当。総当りは非現実的。

function randomBytes(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  return buf;
}

/** 推測不能なランダム URL slug を生成 */
export function generateSlug(): string {
  const bytes = randomBytes(SLUG_LENGTH);
  let out = "";
  for (let i = 0; i < SLUG_LENGTH; i++) {
    out += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  }
  return out;
}

/** 表示用トンネル名(Tom/Dick/Harry + 3桁乱数)を生成 */
export function generateTunnelName(): string {
  const name = TUNNEL_NAMES[randomBytes(1)[0] % TUNNEL_NAMES.length];
  const num = randomBytes(2);
  const n = ((num[0] << 8) | num[1]) % 1000; // 0..999
  return `${name}${String(n).padStart(3, "0")}`;
}
