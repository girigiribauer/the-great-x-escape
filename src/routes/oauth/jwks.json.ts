import { getOAuthClient } from "~/lib/oauthClient";

/** GET /oauth/jwks.json — 本番の private_key_jwt 用の公開鍵セット(ローカルは空)。 */
export async function GET() {
  const client = await getOAuthClient();
  return new Response(JSON.stringify(client.jwks), {
    headers: { "content-type": "application/json" },
  });
}
