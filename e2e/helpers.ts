import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { type BrowserContext, expect, type Page } from "@playwright/test";
import { signCookie } from "../src/lib/signedCookie";

function sessionSecret(): string {
  const envPath = fileURLToPath(new URL("../.env", import.meta.url));
  const m = readFileSync(envPath, "utf8").match(/^SESSION_SECRET=(.*)$/m);
  if (!m) throw new Error(".env に SESSION_SECRET がありません");
  return m[1].trim();
}

export async function loginAs(context: BrowserContext, handle: string, userId = "e2e_1"): Promise<void> {
  const value = signCookie(JSON.stringify({ userId, handle }), sessionSecret());
  await context.addCookies([{ name: "tge_x", value, url: "http://localhost:1963" }]);
}

export async function fillDigMembers(page: Page, members: string) {
  const textarea = page.getByRole("textbox");
  const digButton = page.getByRole("button", { name: /人でトンネルを掘る$/ });
  // ハイドレーション前の fill は Solid に拾われずボタンが有効化しないことがあるため、有効になるまで再入力する。
  await expect(async () => {
    await textarea.fill(members);
    await expect(digButton).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
  return digButton;
}

export async function digTunnel(page: Page, members: string): Promise<string> {
  await page.goto("/dig");
  const digButton = await fillDigMembers(page, members);
  await digButton.click();
  await page.waitForURL(/\/t\/[a-z0-9]+$/i);
  return page.url().split("/t/")[1]!;
}
