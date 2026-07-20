import { deleteCookie, getCookie, setCookie } from "vinxi/http";
import { signCookie, verifyCookie } from "~/lib/signedCookie";
import type { XIdentity } from "~/lib/xIdentity";

// server-only。クライアントの import グラフに載せない(載せると server-only がクライアントバンドルに漏れ、
// 遷移時の描画が壊れる)。呼び出しはサーバールートか "use server" 本体内の動的 import からのみ。

const SESSION_COOKIE = "tge_x";
const MAX_AGE = 60 * 60 * 24 * 30;

function sessionSecret(): string {
  const pw = process.env.SESSION_SECRET;
  if (!pw || pw.length < 32) {
    throw new Error("SESSION_SECRET が未設定/短すぎます(32文字以上必須。.env を確認)");
  }
  return pw;
}

function serialize(data: XIdentity, secret: string): string {
  return signCookie(JSON.stringify(data), secret);
}

function deserialize(raw: string, secret: string): XIdentity | null {
  const json = verifyCookie(raw, secret);
  if (!json) return null;
  try {
    const data = JSON.parse(json);
    if (typeof data?.userId === "string" && typeof data?.handle === "string") {
      return { userId: data.userId, handle: data.handle };
    }
  } catch {
    return null;
  }
  return null;
}

export function readXIdentity(): XIdentity | null {
  const raw = getCookie(SESSION_COOKIE);
  return raw ? deserialize(raw, sessionSecret()) : null;
}

// RPC 化しない(クライアントから叩けると任意の handle でログインを偽装できる)。
export function saveXIdentity(identity: XIdentity): void {
  setCookie(SESSION_COOKIE, serialize(identity, sessionSecret()), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: !!process.env.PUBLIC_URL?.startsWith("https:"),
    maxAge: MAX_AGE,
  });
}

export function clearXIdentity(): void {
  deleteCookie(SESSION_COOKIE, { path: "/" });
}
