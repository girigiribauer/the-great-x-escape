// トンネルの「表示用の名前」と「アクセス用の推測不能 slug」を生成する。
//
// SPEC:
// - 表示用トンネル名 = Tom / Dick / Harry(映画の脱出トンネルの愛称) + ランダム3桁数字
//   例: Tom123, Dick357, Harry042
// - この表示名は "表示用" であって、アクセスURLとは無関係。
// - 実アクセスURLの slug は、推測されないよう表示名と無関係なランダム文字列にする。

const TUNNEL_LABELS = ["Tom", "Dick", "Harry"] as const;

// slug に使う文字集合。紛らわしい文字(0/O, 1/l/I)は除外して誤読・誤入力を防ぐ。
const SLUG_ALPHABET = "23456789abcdefghijkmnpqrstuvwxyz";
const SLUG_LENGTH = 22;

/** 暗号強度の乱数で [0, max) の整数を返す(モジュロ偏りを避ける) */
function randomInt(max: number): number {
  const limit = Math.floor(0xffffffff / max) * max;
  const buf = new Uint32Array(1);
  let x = 0;
  do {
    crypto.getRandomValues(buf);
    x = buf[0]!;
  } while (x >= limit);
  return x % max;
}

/** 表示用トンネル名。例: "Tom137" / "Harry042" */
export function generateTunnelName(): string {
  const label = TUNNEL_LABELS[randomInt(TUNNEL_LABELS.length)]!;
  const num = randomInt(1000).toString().padStart(3, "0");
  return `${label}${num}`;
}

/** アクセス用の推測不能な slug(表示名とは無関係) */
export function generateSlug(): string {
  let s = "";
  for (let i = 0; i < SLUG_LENGTH; i++) {
    s += SLUG_ALPHABET[randomInt(SLUG_ALPHABET.length)];
  }
  return s;
}
