import { createHash, randomBytes } from "node:crypto";

// 方式A: 本人確認後は access_token を捨て、以後は署名セッションで回す(トークンを保持しない)。

const AUTHORIZE_URL = "https://x.com/i/oauth2/authorize";
const TOKEN_URL = "https://api.x.com/2/oauth2/token";
const ME_URL = "https://api.x.com/2/users/me";

// users/me(id/handle 取得)は users.read だけで足りる。tweet.read は付けない
// — ポストは一切読まないので、同意画面に「ポストの読み取り」を出さないため
// (/about の「投稿は読まない」と同意画面を一致させる)。offline.access も無し(=リフレッシュトークン非保持)。
const SCOPES = ["users.read"] as const;

function getConfig(): { clientId: string; clientSecret: string } {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("X_CLIENT_ID / X_CLIENT_SECRET が未設定です(.env を確認)");
  }
  return { clientId, clientSecret };
}

// /x/login と /x/callback で同一文字列になり、Developer Portal 登録値と完全一致させるため request 由来にする。
export function xRedirectUri(request: Request): string {
  return new URL("/x/callback", new URL(request.url).origin).toString();
}

function base64url(buf: Buffer): string {
  return buf.toString("base64url");
}

export function createPkce(): { state: string; codeVerifier: string; codeChallenge: string } {
  const state = base64url(randomBytes(16));
  const codeVerifier = base64url(randomBytes(32));
  const codeChallenge = base64url(createHash("sha256").update(codeVerifier).digest());
  return { state, codeVerifier, codeChallenge };
}

export function buildAuthorizeUrl(opts: { redirectUri: string; state: string; codeChallenge: string }): string {
  const { clientId } = getConfig();
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", opts.redirectUri);
  url.searchParams.set("scope", SCOPES.join(" "));
  url.searchParams.set("state", opts.state);
  url.searchParams.set("code_challenge", opts.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

// 機密クライアントなので client 資格情報は Basic 認証で送る。
export async function exchangeCodeForToken(opts: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<string> {
  const { clientId, clientSecret } = getConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: opts.code,
    redirect_uri: opts.redirectUri,
    code_verifier: opts.codeVerifier,
    client_id: clientId,
  });
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`token exchange failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("token exchange: access_token が返らなかった");
  return json.access_token;
}

export async function fetchXUser(accessToken: string): Promise<{ id: string; username: string }> {
  const res = await fetch(ME_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`users/me failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { data?: { id?: string; username?: string } };
  if (!json.data?.id || !json.data?.username) throw new Error("users/me: id/username が欠落");
  return { id: json.data.id, username: json.data.username };
}
