import { createHmac, timingSafeEqual } from "node:crypto";

// server-only に依存しない純粋モジュール(単体テストのため xSession から分離)。

export function signCookie(value: string, secret: string): string {
  const payload = Buffer.from(value).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyCookie(raw: string, secret: string): string | null {
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = raw.slice(0, dot);
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(raw.slice(dot + 1));
  const b = Buffer.from(expected);
  // 長さが違うと timingSafeEqual が例外を投げるので先に弾く。
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return Buffer.from(payload, "base64url").toString();
  } catch {
    return null;
  }
}
