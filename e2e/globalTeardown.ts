import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

function env(key: string): string {
  const text = readFileSync(fileURLToPath(new URL("../.env", import.meta.url)), "utf8");
  return text.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1].trim() ?? "";
}

// テストが掘ったトンネル(e2e_judge が作成者)を消して、件数が走るたびに増えないようにする。
export default async function globalTeardown() {
  const url = env("SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return;

  const supabase = createClient(url, serviceKey);
  // e2e の loginAs は userId="e2e_1" 固定。作成者=その user_id の room を消す。
  const { error } = await supabase.from("rooms").delete().eq("admin_x_user_id", "e2e_1");
  if (error) throw error;
}
