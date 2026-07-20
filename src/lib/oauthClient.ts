import {
  buildAtprotoLoopbackClientMetadata,
  NodeOAuthClient,
  type NodeSavedSession,
  type NodeSavedState,
} from "@atproto/oauth-client-node";
import { getSupabaseClient } from "~/lib/supabaseClient";

// 本番の公開URL。未設定(=ローカル)ならループバック用メタデータを使う。
// dev サーバーは 127.0.0.1:1963 でアクセスすること(loopback OAuth の要件)。
const LOOPBACK_REDIRECT = "http://127.0.0.1:1963/bsky/callback";

function buildClientMetadata() {
  const baseUrl = process.env.PUBLIC_URL;

  if (!baseUrl || !baseUrl.startsWith("https:")) {
    return buildAtprotoLoopbackClientMetadata({
      scope: "atproto",
      redirect_uris: [LOOPBACK_REDIRECT],
    });
  }

  return {
    client_id: `${baseUrl}/oauth/client-metadata.json`,
    client_name: "X大脱出 (The Great X Escape)",
    client_uri: baseUrl,
    redirect_uris: [`${baseUrl}/bsky/callback`] as [string],
    scope: "atproto",
    grant_types: ["authorization_code", "refresh_token"] as ["authorization_code", "refresh_token"],
    response_types: ["code"] as ["code"],
    token_endpoint_auth_method: "private_key_jwt" as const,
    token_endpoint_auth_signing_alg: "ES256" as const,
    dpop_bound_access_tokens: true,
    jwks_uri: `${baseUrl}/oauth/jwks.json`,
    application_type: "web" as const,
  };
}

let _client: NodeOAuthClient | null = null;

/**
 * Bluesky OAuth クライアント(サーバー専用)。
 * state / session は Supabase の oauth_states / oauth_sessions に保存する。
 * (bluesky-official-accounts の実装を移植)
 */
export async function getOAuthClient(): Promise<NodeOAuthClient> {
  if (_client) return _client;

  const supabase = getSupabaseClient();

  const stateStore = {
    async get(key: string): Promise<NodeSavedState | undefined> {
      const { data, error } = await supabase
        .from("oauth_states")
        .select("value")
        .eq("key", key)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data?.value as unknown as NodeSavedState | undefined;
    },
    async set(key: string, value: NodeSavedState): Promise<void> {
      const { error } = await supabase.from("oauth_states").upsert({ key, value });
      if (error) throw error;
      // 中断された認証で残る古い state を、新しい試行のたびに掃除(opportunistic GC)。
      // 認可往復は数分で終わるので 1 時間より古いものは死んでいるとみなす。
      const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      await supabase.from("oauth_states").delete().lt("created_at", cutoff);
    },
    async del(key: string): Promise<void> {
      await supabase.from("oauth_states").delete().eq("key", key);
    },
  };

  const sessionStore = {
    async get(sub: string): Promise<NodeSavedSession | undefined> {
      const { data, error } = await supabase
        .from("oauth_sessions")
        .select("value")
        .eq("did", sub)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data?.value as unknown as NodeSavedSession | undefined;
    },
    async set(sub: string, value: NodeSavedSession): Promise<void> {
      const { error } = await supabase
        .from("oauth_sessions")
        .upsert({ did: sub, value, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    async del(sub: string): Promise<void> {
      await supabase.from("oauth_sessions").delete().eq("did", sub);
    },
  };

  // 本番のみ秘密鍵で keyset を構成(private_key_jwt 用)。ローカルは不要。
  // private_key_jwt は「kid を持つ署名鍵」を要求するが、生成した JWK には kid が無いため
  // import 時に明示的に付与する(jwks.json と private_key_jwt の kid はこの keyset で一致する)。
  const keyset = process.env.OAUTH_PRIVATE_KEY
    ? await import("@atproto/jwk-jose")
        .then(({ JoseKey }) => JoseKey.fromImportable(JSON.parse(process.env.OAUTH_PRIVATE_KEY!), "key1"))
        .then((key) => import("@atproto/jwk").then(({ Keyset }) => new Keyset([key])))
    : undefined;

  _client = new NodeOAuthClient({
    clientMetadata: buildClientMetadata(),
    stateStore,
    sessionStore,
    keyset,
  });

  return _client;
}
