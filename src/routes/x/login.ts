import type { APIEvent } from "@solidjs/start/server";
import { setCookie } from "vinxi/http";
import { buildAuthorizeUrl, createPkce, xRedirectUri } from "~/lib/xOAuth";

const PKCE_COOKIE = "tge_x_pkce";

export function GET(event: APIEvent) {
  const url = new URL(event.request.url);
  const redirectTo = url.searchParams.get("redirectTo");
  // オープンリダイレクト防止のため内部パスのみ許可。
  const safeRedirect = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dig";

  const redirectUri = xRedirectUri(event.request);
  const { state, codeVerifier, codeChallenge } = createPkce();

  setCookie(PKCE_COOKIE, JSON.stringify({ state, codeVerifier, redirectTo: safeRedirect }), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    maxAge: 60 * 10,
  });

  return Response.redirect(buildAuthorizeUrl({ redirectUri, state, codeChallenge }), 302);
}
