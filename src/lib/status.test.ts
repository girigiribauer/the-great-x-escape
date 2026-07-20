import { describe, expect, it } from "vitest";
import { extractHandle, isValidXHandle, normalizeXHandle, parseHandlesInput } from "~/lib/status";

describe("normalizeXHandle", () => {
  it("先頭の @ を除き小文字化・トリムする", () => {
    expect(normalizeXHandle("  @Nakama_A ")).toBe("nakama_a");
    expect(normalizeXHandle("@@double")).toBe("double");
    expect(normalizeXHandle("PlainHandle")).toBe("plainhandle");
  });
});

describe("isValidXHandle", () => {
  it("英数と _ の1〜15文字を有効とする", () => {
    expect(isValidXHandle("abc")).toBe(true);
    expect(isValidXHandle("a_1")).toBe(true);
    expect(isValidXHandle("123456789012345")).toBe(true); // 15文字
  });
  it("空・16文字以上・不正文字は無効", () => {
    expect(isValidXHandle("")).toBe(false);
    expect(isValidXHandle("1234567890123456")).toBe(false); // 16文字
    expect(isValidXHandle("has-dash")).toBe(false);
    expect(isValidXHandle("スペース")).toBe(false);
    expect(isValidXHandle("Upper")).toBe(false); // 正規化前提(小文字のみ)
  });
});

describe("extractHandle", () => {
  it("素のハンドル / @あり を取り出す", () => {
    expect(extractHandle("nakama_a")).toBe("nakama_a");
    expect(extractHandle("@Nakama_A")).toBe("nakama_a");
  });
  it("x.com / twitter.com のプロフィールURLから取り出す", () => {
    expect(extractHandle("https://x.com/nakama_b")).toBe("nakama_b");
    expect(extractHandle("https://twitter.com/@Foo_Bar")).toBe("foo_bar");
    expect(extractHandle("http://x.com/#!/legacy")).toBe("legacy");
    expect(extractHandle("x.com/mixedCase/status/123")).toBe("mixedcase");
  });
  it("空・不正・別ドメインは null", () => {
    expect(extractHandle("")).toBeNull();
    expect(extractHandle("   ")).toBeNull();
    expect(extractHandle("has-dash")).toBeNull();
    expect(extractHandle("https://example.com/foo")).toBeNull();
    expect(extractHandle("this_handle_is_way_too_long")).toBeNull(); // 15文字超
  });
});

describe("parseHandlesInput", () => {
  it("改行・カンマ区切りを解析し、正規化・重複除去する", () => {
    const input = "@Nakama_A\nhttps://x.com/nakama_b, mayoi_c\nNAKAMA_A";
    expect(parseHandlesInput(input)).toEqual(["nakama_a", "nakama_b", "mayoi_c"]);
  });
  it("exclude に渡したハンドル(審判自身など)を除外する", () => {
    const input = "testjudge\n@friend\ntestjudge";
    expect(parseHandlesInput(input, ["@TestJudge"])).toEqual(["friend"]);
  });
  it("不正・空トークンは黙って捨てる", () => {
    expect(parseHandlesInput("has-dash, , @ok, https://example.com/x")).toEqual(["ok"]);
  });
  it("空入力は空配列", () => {
    expect(parseHandlesInput("")).toEqual([]);
    expect(parseHandlesInput("\n , \n")).toEqual([]);
  });
});
