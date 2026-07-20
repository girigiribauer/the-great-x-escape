import { getOAuthClient } from "~/lib/oauthClient";

/** GET /oauth/client-metadata.json — 本番で Bluesky 側が参照するクライアントメタデータ。 */
export async function GET() {
  const client = await getOAuthClient();
  return new Response(JSON.stringify(client.clientMetadata), {
    headers: { "content-type": "application/json" },
  });
}
