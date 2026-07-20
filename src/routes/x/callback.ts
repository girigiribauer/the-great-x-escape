import type { APIEvent } from "@solidjs/start/server";
import { deleteCookie, getCookie } from "vinxi/http";
import { normalizeXHandle } from "~/lib/status";
import { saveXIdentity } from "~/lib/xSession";
import { exchangeCodeForToken, fetchXUser, xRedirectUri } from "~/lib/xOAuth";

const PKCE_COOKIE = "tge_x_pkce";

export async function GET(event: APIEvent) {
  const url = new URL(event.request.url);
  // TOP がログイン入口を兼ねるので、失敗も TOP に戻して通知する(/login は廃止)。
  const fail = (err: string) => Response.redirect(`${url.origin}/?x_error=${err}`, 302);

  if (url.searchParams.get("error")) return fail(url.searchParams.get("error")!);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return fail("missing_code");

  const raw = getCookie(PKCE_COOKIE);
  deleteCookie(PKCE_COOKIE, { path: "/" });
  if (!raw) return fail("missing_pkce");

  let saved: { state: string; codeVerifier: string; redirectTo: string };
  try {
    saved = JSON.parse(raw);
  } catch {
    return fail("bad_pkce");
  }
  if (saved.state !== state) return fail("state_mismatch");

  try {
    const redirectUri = xRedirectUri(event.request);
    const accessToken = await exchangeCodeForToken({ code, codeVerifier: saved.codeVerifier, redirectUri });
    const user = await fetchXUser(accessToken);
    // entries との突き合わせは normalizeXHandle 基準なので、保存時に正規化しておく。
    await saveXIdentity({ userId: user.id, handle: normalizeXHandle(user.username) });
  } catch {
    return fail("oauth_failed");
  }

  const back = saved.redirectTo && saved.redirectTo.startsWith("/") ? saved.redirectTo : "/dig";
  return Response.redirect(`${url.origin}${back}`, 302);
}
