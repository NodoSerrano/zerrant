import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { shrinkAvatarImage } from "./avatar-resize";

function photo(bytes: number, name = "camara.png", type = "image/png") {
  return new File([new Uint8Array(bytes)], name, { type });
}

function stubBitmap(width: number, height: number) {
  const bitmap = { width, height, close: vi.fn() };
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(bitmap));
  return bitmap;
}

function stubCanvas(resultBytes: number) {
  const drawImage = vi.fn();
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn().mockReturnValue({ drawImage, fillRect: vi.fn(), fillStyle: "" }),
    toBlob: (cb: (blob: Blob | null) => void) =>
      cb(new Blob([new Uint8Array(resultBytes)], { type: "image/jpeg" })),
  };
  vi.spyOn(document, "createElement").mockReturnValue(canvas as unknown as HTMLCanvasElement);
  return { canvas, drawImage };
}

beforeEach(() => {
  vi.stubGlobal("OffscreenCanvas", undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("shrinkAvatarImage", () => {
  it("shrinks a large image to 1024px on the longest side as a JPEG", async () => {
    const bitmap = stubBitmap(4000, 3000);
    const { canvas, drawImage } = stubCanvas(200_000);

    const result = await shrinkAvatarImage(photo(8_000_000));

    expect(canvas.width).toBe(1024);
    expect(canvas.height).toBe(768);
    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 1024, 768);
    expect(result.name).toBe("camara.jpg");
    expect(result.type).toBe("image/jpeg");
    expect(result.size).toBe(200_000);
    expect(bitmap.close).toHaveBeenCalled();
  });

  it("scales portrait images by their height", async () => {
    stubBitmap(3000, 4000);
    const { canvas } = stubCanvas(100_000);

    await shrinkAvatarImage(photo(8_000_000));

    expect(canvas.width).toBe(768);
    expect(canvas.height).toBe(1024);
  });

  it("never enlarges a small image", async () => {
    stubBitmap(400, 300);
    const { canvas } = stubCanvas(1_000);

    await shrinkAvatarImage(photo(50_000));

    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(300);
  });

  it("returns the original when createImageBitmap is unavailable", async () => {
    vi.stubGlobal("createImageBitmap", undefined);
    const original = photo(8_000_000);

    expect(await shrinkAvatarImage(original)).toBe(original);
  });

  it("returns the original when decoding rejects (e.g. HEIC in Chrome)", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn().mockRejectedValue(new Error("decode")));
    const original = photo(8_000_000, "foto.heic", "image/heic");

    expect(await shrinkAvatarImage(original)).toBe(original);
  });

  it("returns the original when the result is not smaller", async () => {
    const bitmap = stubBitmap(1000, 800);
    stubCanvas(900_000);
    const original = photo(500_000);

    expect(await shrinkAvatarImage(original)).toBe(original);
    expect(bitmap.close).toHaveBeenCalled();
  });

  it("returns the original when the canvas cannot export", async () => {
    stubBitmap(4000, 3000);
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(null),
      toBlob: vi.fn(),
    };
    vi.spyOn(document, "createElement").mockReturnValue(canvas as unknown as HTMLCanvasElement);
    const original = photo(8_000_000);

    expect(await shrinkAvatarImage(original)).toBe(original);
  });

  it("paints a white background before drawing on the DOM canvas (JPEG has no alpha)", async () => {
    stubBitmap(4000, 3000);
    const calls: string[] = [];
    const context = {
      set fillStyle(value: string) {
        calls.push(`fillStyle=${value}`);
      },
      fillRect: vi.fn((...args: number[]) => calls.push(`fillRect(${args.join(",")})`)),
      drawImage: vi.fn(() => calls.push("drawImage")),
    };
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(context),
      toBlob: (cb: (blob: Blob | null) => void) =>
        cb(new Blob([new Uint8Array(1000)], { type: "image/jpeg" })),
    };
    vi.spyOn(document, "createElement").mockReturnValue(canvas as unknown as HTMLCanvasElement);

    await shrinkAvatarImage(photo(8_000_000));

    expect(calls).toEqual(["fillStyle=#ffffff", "fillRect(0,0,1024,768)", "drawImage"]);
  });

  it("paints a white background before drawing on OffscreenCanvas", async () => {
    stubBitmap(4000, 3000);
    const calls: string[] = [];
    const context = {
      set fillStyle(value: string) {
        calls.push(`fillStyle=${value}`);
      },
      fillRect: (...args: number[]) => calls.push(`fillRect(${args.join(",")})`),
      drawImage: () => calls.push("drawImage"),
    };
    class FakeOffscreen {
      constructor(
        public width: number,
        public height: number,
      ) {}
      getContext() {
        return context;
      }
      convertToBlob() {
        return Promise.resolve(new Blob([new Uint8Array(1000)], { type: "image/jpeg" }));
      }
    }
    vi.stubGlobal("OffscreenCanvas", FakeOffscreen);

    await shrinkAvatarImage(photo(8_000_000));

    expect(calls).toEqual(["fillStyle=#ffffff", "fillRect(0,0,1024,768)", "drawImage"]);
  });

  it("uses OffscreenCanvas when available", async () => {
    stubBitmap(4000, 3000);
    const drawImage = vi.fn();
    const context = { drawImage, fillRect: vi.fn(), fillStyle: "" };
    class FakeOffscreen {
      constructor(
        public width: number,
        public height: number,
      ) {}
      getContext() {
        return context;
      }
      convertToBlob() {
        return Promise.resolve(new Blob([new Uint8Array(1000)], { type: "image/jpeg" }));
      }
    }
    vi.stubGlobal("OffscreenCanvas", FakeOffscreen);

    const result = await shrinkAvatarImage(photo(8_000_000));

    expect(result.type).toBe("image/jpeg");
    expect(drawImage).toHaveBeenCalled();
  });
});
