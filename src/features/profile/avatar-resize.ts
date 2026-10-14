const MAX_SIDE = 1024;
const JPEG_QUALITY = 0.85;

type Context2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

// JPEG has no alpha: without a backdrop, transparent PNG pixels turn black.
function paintOnWhite(context: Context2D, bitmap: ImageBitmap, width: number, height: number) {
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
}

async function renderJpeg(
  bitmap: ImageBitmap,
  width: number,
  height: number,
): Promise<Blob | null> {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");
    if (!context) return null;
    paintOnWhite(context, bitmap, width, height);
    return canvas.convertToBlob({ type: "image/jpeg", quality: JPEG_QUALITY });
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  paintOnWhite(context, bitmap, width, height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
}

/**
 * Downscales a photo (longest side ≤ 1024 px, JPEG) so phone-camera shots fit
 * the upload limit. Best effort: anything that can't be decoded or doesn't get
 * smaller comes back untouched — the server stays the authority. Never throws.
 */
export async function shrinkAvatarImage(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function") return file;

  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const blob = await renderJpeg(bitmap, width, height);
    if (!blob || blob.size === 0 || blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^./\\]+$/, "") || "foto";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}
