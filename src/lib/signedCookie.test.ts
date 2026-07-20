import { describe, expect, it } from "vitest";
import { signCookie, verifyCookie } from "~/lib/signedCookie";

const SECRET = "test-secret-at-least-32-chars-long-xxxx";

describe("signCookie / verifyCookie", () => {
  it("往復: 署名した値を同じ鍵で検証すると元に戻る", () => {
    const value = JSON.stringify({ userId: "u1", handle: "nakama" });
    const signed = signCookie(value, SECRET);
    expect(verifyCookie(signed, SECRET)).toBe(value);
  });

  it("payload を改竄すると検証は null", () => {
    const signed = signCookie("hello", SECRET);
    const [, sig] = signed.split(".");
    const tampered = `${Buffer.from("evil").toString("base64url")}.${sig}`;
    expect(verifyCookie(tampered, SECRET)).toBeNull();
  });

  it("署名を改竄すると null", () => {
    const signed = signCookie("hello", SECRET);
    const [payload] = signed.split(".");
    expect(verifyCookie(`${payload}.deadbeef`, SECRET)).toBeNull();
  });

  it("別の鍵で検証すると null(署名鍵を知らない攻撃者は偽造できない)", () => {
    const signed = signCookie("hello", SECRET);
    expect(verifyCookie(signed, "another-secret-32-chars-xxxxxxxxxxxx")).toBeNull();
  });

  it("形式不正(区切り無し)は null", () => {
    expect(verifyCookie("no-dot-here", SECRET)).toBeNull();
    expect(verifyCookie("", SECRET)).toBeNull();
  });

  it("長さの異なる署名でも例外を投げず null(timingSafeEqual の長さガード)", () => {
    const signed = signCookie("hello", SECRET);
    const [payload] = signed.split(".");
    expect(verifyCookie(`${payload}.x`, SECRET)).toBeNull();
  });
});
