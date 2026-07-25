import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  convert: vi.fn(),
}));

vi.mock("heic-convert", () => ({ default: mocks.convert }));

import { ensureWebSafeImage } from "./avatar-convert";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ensureWebSafeImage", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])(
    "leaves %s untouched and never invokes the converter",
    async (mime) => {
      const bytes = new Uint8Array([1, 2, 3]);

      const result = await ensureWebSafeImage(bytes, mime);

      expect(result).toEqual({ bytes, mime });
      expect(mocks.convert).not.toHaveBeenCalled();
    },
  );

  it("converts HEIC to JPEG", async () => {
    const heic = new Uint8Array([9, 9, 9]);
    mocks.convert.mockResolvedValue(new Uint8Array([4, 5, 6]).buffer);

    const result = await ensureWebSafeImage(heic, "image/heic");

    expect(mocks.convert).toHaveBeenCalledWith({
      buffer: heic,
      format: "JPEG",
      quality: 0.9,
    });
    expect(result.mime).toBe("image/jpeg");
    expect(Array.from(result.bytes)).toEqual([4, 5, 6]);
  });

  it("throws a Spanish error when the HEIC file cannot be decoded", async () => {
    mocks.convert.mockRejectedValue(new Error("libheif: invalid input"));

    await expect(ensureWebSafeImage(new Uint8Array([9]), "image/heic")).rejects.toThrow(
      "No pudimos procesar la imagen HEIC. Probá con JPG o PNG",
    );
  });
});
