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
    expect(telegramHref("@juan")).toBe("https://t.me/juan");
  });

  it("keeps a bare handle", () => {
    expect(telegramHref("juan")).toBe("https://t.me/juan");
  });

  it("trims whitespace", () => {
    expect(telegramHref("  @juan  ")).toBe("https://t.me/juan");
  });

  it("keeps an existing http(s) URL as-is", () => {
    expect(telegramHref("https://t.me/juan")).toBe("https://t.me/juan");
    expect(telegramHref("http://t.me/juan")).toBe("http://t.me/juan");
  });

  it("returns null for empty or blank values", () => {
    expect(telegramHref(null)).toBeNull();
    expect(telegramHref(undefined)).toBeNull();
    expect(telegramHref("")).toBeNull();
    expect(telegramHref("   ")).toBeNull();
  });
});
