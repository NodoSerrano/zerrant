import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { avatarObjectPath, sniffImageType } from "./avatar";
import { ensureWebSafeImage } from "./avatar-convert";

// Unlike avatar-convert.test.ts, heic-convert is NOT mocked here: libheif
// actually runs over a real HEIC (generated with `sips -s format heic`).
// It's the only thing that proves an iPhone photo ends up as a usable JPEG.
const sampleHeic = new Uint8Array(readFileSync(join(__dirname, "__fixtures__/sample.heic")));

describe("HEIC pipeline with real bytes", () => {
  it("detects the HEIC by its signature", () => {
    expect(sniffImageType(sampleHeic)).toBe("image/heic");
  });

  it("converts it to a JPEG with a valid signature", async () => {
    const result = await ensureWebSafeImage(sampleHeic, "image/heic");

    expect(result.mime).toBe("image/jpeg");
    expect(Array.from(result.bytes.slice(0, 3))).toEqual([0xff, 0xd8, 0xff]);
    expect(result.bytes.length).toBeGreaterThan(0);
  });

  it("the resulting JPEG is detected again as jpeg and stored with a .jpg extension", async () => {
    const result = await ensureWebSafeImage(sampleHeic, "image/heic");

    expect(sniffImageType(result.bytes)).toBe("image/jpeg");
    expect(avatarObjectPath("user-1", result.mime)).toMatch(/\.jpg$/);
  });
});
