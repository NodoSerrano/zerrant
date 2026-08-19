import { describe, expect, it } from "vitest";
import { canSeeRate, telegramHref } from "./visibility";

describe("canSeeRate", () => {
  it("allows self even when tarifa is privada", () => {
    expect(
      canSeeRate({ isSelf: true, isAdmin: false, visibilidadTarifa: "privada", hasTarifa: true }),
    ).toBe(true);
  });

  it("allows admin even when tarifa is privada", () => {
    expect(
      canSeeRate({ isSelf: false, isAdmin: true, visibilidadTarifa: "privada", hasTarifa: true }),
    ).toBe(true);
  });

  it("allows a publica tarifa to any serrano", () => {
    expect(
      canSeeRate({ isSelf: false, isAdmin: false, visibilidadTarifa: "publica", hasTarifa: true }),
    ).toBe(true);
  });

  it("denies a privada tarifa to a third-party serrano", () => {
    expect(
      canSeeRate({ isSelf: false, isAdmin: false, visibilidadTarifa: "privada", hasTarifa: true }),
    ).toBe(false);
  });

  it("denies when tarifa_hora is null regardless of visibility", () => {
    expect(
      canSeeRate({ isSelf: true, isAdmin: false, visibilidadTarifa: "publica", hasTarifa: false }),
    ).toBe(false);
  });
});

describe("telegramHref", () => {
  it("strips a leading @ and builds the t.me deep link", () => {
    expect(telegramHref("@juancito")).toBe("https://t.me/juancito");
  });

  it("keeps a bare handle", () => {
    expect(telegramHref("juancito")).toBe("https://t.me/juancito");
  });

  it("trims whitespace", () => {
    expect(telegramHref("  @juancito  ")).toBe("https://t.me/juancito");
  });

  it("normalizes a t.me URL to the canonical form", () => {
    expect(telegramHref("https://t.me/juancito")).toBe("https://t.me/juancito");
  });

  it("upgrades http to https", () => {
    expect(telegramHref("http://t.me/juancito")).toBe("https://t.me/juancito");
  });

  it("canonicalizes a telegram.me URL to t.me", () => {
    expect(telegramHref("https://telegram.me/juancito")).toBe("https://t.me/juancito");
  });

  it("accepts a schemeless t.me URL", () => {
    expect(telegramHref("t.me/juancito")).toBe("https://t.me/juancito");
  });

  it("rejects an arbitrary external URL", () => {
    expect(telegramHref("https://evil.example")).toBeNull();
    expect(telegramHref("https://evil.example/juancito")).toBeNull();
  });

  it("rejects a lookalike host that is not exactly t.me", () => {
    expect(telegramHref("https://t.me.evil.com/juancito")).toBeNull();
  });

  it("rejects javascript and other non-http schemes", () => {
    expect(telegramHref("javascript:alert(1)")).toBeNull();
  });

  it("rejects URLs with a query string", () => {
    expect(telegramHref("https://t.me/juancito?x=1")).toBeNull();
  });

  it("rejects non-handle telegram paths", () => {
    expect(telegramHref("https://t.me/+invite")).toBeNull();
    expect(telegramHref("https://t.me/s/canal")).toBeNull();
    expect(telegramHref("https://t.me/")).toBeNull();
    expect(telegramHref("https://t.me/juancito/")).toBeNull();
    expect(telegramHref("https://t.me//juancito")).toBeNull();
  });

  it("rejects handles with slashes or spaces", () => {
    expect(telegramHref("juancito/extra")).toBeNull();
    expect(telegramHref("juan perez")).toBeNull();
  });

  it("rejects handles shorter than 5 chars", () => {
    expect(telegramHref("@ab")).toBeNull();
    expect(telegramHref("juan")).toBeNull();
  });

  it("returns null for empty or blank values", () => {
    expect(telegramHref(null)).toBeNull();
    expect(telegramHref(undefined)).toBeNull();
    expect(telegramHref("")).toBeNull();
    expect(telegramHref("   ")).toBeNull();
  });
});
