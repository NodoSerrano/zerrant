export const AVATAR_BUCKET = "avatars";

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/** Formats we accept from the user. HEIC gets in but is converted before uploading. */
export const AVATAR_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

/** Formats that end up in Storage: the ones every browser can render. */
export const AVATAR_STORED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heic",
};

const HEIC_BRANDS = ["heic", "heix", "heim", "heis", "mif1", "msf1"];

const PUBLIC_PREFIX = `/storage/v1/object/public/${AVATAR_BUCKET}/`;

/** Validates what the browser declares. The truth comes from sniffImageType over the bytes. */
export function validateAvatarFile(file: unknown): string | null {
  if (!(file instanceof File) || file.size === 0) {
    return "Seleccioná una imagen";
  }

  if (!AVATAR_ACCEPTED_TYPES.includes(file.type as (typeof AVATAR_ACCEPTED_TYPES)[number])) {
    return "Formato no permitido. Usá JPG, PNG, WebP o HEIC";
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return "La imagen no puede superar los 5 MB";
  }

  return null;
}

function readAscii(bytes: Uint8Array, start: number, length: number): string {
  let out = "";
  for (let i = start; i < start + length; i++) {
    out += String.fromCharCode(bytes[i]);
  }
  return out;
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, i) => bytes[i] === byte);
}

/** Detects the real type via magic numbers — it doesn't trust the mime the client declares. */
export function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length < 3) {
    return null;
  }

  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }

  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }

  // WebP and HEIC declare their brand as late as byte 8
  if (bytes.length < 12) {
    return null;
  }

  if (readAscii(bytes, 0, 4) === "RIFF" && readAscii(bytes, 8, 4) === "WEBP") {
    return "image/webp";
  }

  if (readAscii(bytes, 4, 4) === "ftyp" && HEIC_BRANDS.includes(readAscii(bytes, 8, 4))) {
    return "image/heic";
  }

  return null;
}

/** `<userId>/` folder — it's what the storage.objects policy uses to authorize. */
export function avatarObjectPath(userId: string, mime: string): string {
  const extension = EXTENSION_BY_TYPE[mime] ?? "jpg";
  return `${userId}/${crypto.randomUUID()}.${extension}`;
}

export function avatarPathFromPublicUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }

  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return null;
  }

  if (!pathname.startsWith(PUBLIC_PREFIX)) {
    return null;
  }

  return pathname.slice(PUBLIC_PREFIX.length) || null;
}
