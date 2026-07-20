import { expect, test } from "@playwright/test";
import { digTunnel, fillDigMembers, loginAs } from "./helpers";

const JUDGE = "e2e_judge";

// X OAuth の往復はテストしない。偽造セッション Cookie でログイン状態を注入する(helpers.ts)。
test.describe("主要フロー", () => {
  test("掘る: 仲間0では掘れない / 仲間を入れると掘れて名簿が出る", async ({ page, context }) => {
    await loginAs(context, JUDGE);
    await page.goto("/dig");

    await expect(page.getByRole("button", { name: /1人以上入れてください/ })).toBeDisabled();

    const digButton = await fillDigMembers(page, "e2e_a\ne2e_b");
    await expect(page.getByRole("button", { name: "3人でトンネルを掘る" })).toBeVisible();
    await digButton.click();

    await expect(page).toHaveURL(/\/t\/[a-z0-9]+$/i);
    await expect(page.getByRole("link", { name: "@e2e_judge" })).toBeVisible();
    await expect(page.getByRole("link", { name: "@e2e_a" })).toBeVisible();
    await expect(page.getByRole("link", { name: "@e2e_b" })).toBeVisible();
  });

  test("本人申告: 残留にできて、収容に取り消せる(誤爆ロックの回帰)", async ({ page, context }) => {
    await loginAs(context, JUDGE);
    await digTunnel(page, "e2e_x");

    const select = page.locator("select").first();
    await select.selectOption("stayed");
    await expect(page.getByRole("img", { name: "残留" }).first()).toBeVisible();

    await select.selectOption("not_migrated");
    await expect(page.getByRole("img", { name: "収容" }).first()).toBeVisible();
  });

  test("代理記録: 作成者が他人を Bluesky ハンドルで脱獄記録できる(本人ログイン不要)", async ({ page, context }) => {
    await loginAs(context, JUDGE);
    await digTunnel(page, "e2e_member");

    await page.getByRole("button", { name: "状態を変更" }).first().click();
    await page.getByRole("button", { name: "脱獄（完全移行）" }).click();
    await page.getByPlaceholder("their.bsky.social").fill("bsky.app");
    await page.getByRole("button", { name: "記録する" }).click();

    await expect(page.getByRole("link", { name: "@bsky.app" })).toBeVisible();
  });

  test("トンネル一覧: 作った部屋が出て、削除すると消える", async ({ page, context }) => {
    await loginAs(context, JUDGE);
    await digTunnel(page, "e2e_del");

    await page.goto("/tunnels");
    const rows = page.locator("li");
    const before = await rows.count();
    expect(before).toBeGreaterThan(0);

    const firstRow = rows.first();
    const confirm = firstRow.getByRole("button", { name: "消す" });
    // ハイドレーション前クリックは拾われないので、確認ボタンが出るまで削除クリックを試行する。
    await expect(async () => {
      const del = firstRow.getByRole("button", { name: "削除" });
      if (await del.isVisible()) await del.click();
      await expect(confirm).toBeVisible({ timeout: 800 });
    }).toPass({ timeout: 15_000 });
    await confirm.click();

    await expect(rows).toHaveCount(before - 1);
  });

  test("非作成者(参加者): 作成者の▾は出ないが、自分の行のステータスは変えられる", async ({ page, context }) => {
    await loginAs(context, JUDGE);
    const slug = await digTunnel(page, "e2e_player");

    await context.clearCookies();
    await loginAs(context, "e2e_player");
    await page.goto(`/t/${slug}`);

    await expect(page.getByText("あなた", { exact: true })).toBeVisible();
    await expect(page.locator("select")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "状態を変更" })).toHaveCount(0);

    await page.locator("select").selectOption("stayed");
    await expect(page.getByRole("img", { name: "残留" })).toBeVisible();
  });

  test("未ログイン: /dig は入口へリダイレクトされる", async ({ page }) => {
    await page.goto("/dig");
    await expect(page).toHaveURL("http://localhost:1963/");
  });
});
