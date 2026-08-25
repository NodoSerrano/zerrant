import convert from "heic-convert";

import { AVATAR_STORED_TYPES } from "./avatar";

type WebSafeImage = { bytes: Uint8Array; mime: string };

/**
 * Only Safari renders HEIC, so we never store it raw: it's converted to
 * JPEG before uploading. All other formats are returned untouched.
 */
export async function ensureWebSafeImage(bytes: Uint8Array, mime: string): Promise<WebSafeImage> {
  if (AVATAR_STORED_TYPES.includes(mime as (typeof AVATAR_STORED_TYPES)[number])) {
    return { bytes, mime };
  }

  try {
    const jpeg = await convert({ buffer: bytes, format: "JPEG", quality: 0.9 });
    return { bytes: new Uint8Array(jpeg), mime: "image/jpeg" };
  } catch {
    throw new Error("No pudimos procesar la imagen HEIC. Probá con JPG o PNG");
  }
}
