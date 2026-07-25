import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { avatarObjectPath, sniffImageType } from "./avatar";
import { ensureWebSafeImage } from "./avatar-convert";

// A diferencia de avatar-convert.test.ts, acá NO se mockea heic-convert: se
// corre libheif de verdad sobre un HEIC real (generado con `sips -s format heic`).
// Es lo único que prueba que la foto de un iPhone termine siendo un JPEG usable.
const sampleHeic = new Uint8Array(readFileSync(join(__dirname, "__fixtures__/sample.heic")));

describe("pipeline HEIC con bytes reales", () => {
  it("detecta el HEIC por su firma", () => {
    expect(sniffImageType(sampleHeic)).toBe("image/heic");
  });

  it("lo convierte a un JPEG con firma válida", async () => {
    const result = await ensureWebSafeImage(sampleHeic, "image/heic");

    expect(result.mime).toBe("image/jpeg");
    expect(Array.from(result.bytes.slice(0, 3))).toEqual([0xff, 0xd8, 0xff]);
    expect(result.bytes.length).toBeGreaterThan(0);
  });

  it("el JPEG resultante vuelve a detectarse como jpeg y se guarda con extensión .jpg", async () => {
    const result = await ensureWebSafeImage(sampleHeic, "image/heic");

    expect(sniffImageType(result.bytes)).toBe("image/jpeg");
    expect(avatarObjectPath("user-1", result.mime)).toMatch(/\.jpg$/);
  });
});
