export const AVATAR_BUCKET = "avatars";

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/** Formatos que aceptamos del usuario. HEIC entra pero se convierte antes de subir. */
export const AVATAR_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

/** Formatos que terminan en Storage: los que todos los browsers saben renderizar. */
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

/** Valida lo que el browser declara. La verdad la da sniffImageType sobre los bytes. */
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

/** Detecta el tipo real por magic numbers — no confía en el mime que declara el cliente. */
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

  // WebP y HEIC declaran su marca recién en el byte 8
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

/** Carpeta `<userId>/` — es lo que la policy de storage.objects usa para autorizar. */
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
