import { action, query, redirect } from "@solidjs/router";
import { isValidXHandle, normalizeXHandle } from "~/lib/status";

export type XIdentity = { userId: string; handle: string };

// クライアント各ページから import される。よって top-level で server-only(node:crypto / vinxi/http)を
// import せず、実処理は "use server" 本体内で ~/lib/xSession を動的 import して呼ぶ。

export function parseHandle(raw: string): string | null {
  const h = normalizeXHandle(raw);
  return isValidXHandle(h) ? h : null;
}

export const getXIdentity = query(async (): Promise<XIdentity | null> => {
  "use server";
  const { readXIdentity } = await import("~/lib/xSession");
  return readXIdentity();
}, "xIdentity");

export const xLogout = action(async () => {
  "use server";
  const { clearXIdentity } = await import("~/lib/xSession");
  clearXIdentity();
  throw redirect("/");
}, "xLogout");
