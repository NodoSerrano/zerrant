import { describe, expect, it } from "vitest";

import {
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
  avatarObjectPath,
  avatarPathFromPublicUrl,
  sniffImageType,
  validateAvatarFile,
} from "./avatar";

function fileOf(name: string, type: string, size: number): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function bytesOf(...values: number[]): Uint8Array {
  return new Uint8Array(values);
}

function ascii(text: string): number[] {
  return [...text].map((char) => char.charCodeAt(0));
}

describe("validateAvatarFile", () => {
  it("rejects a missing file", () => {
    expect(validateAvatarFile(null)).toBe("Seleccioná una imagen");
  });

  it("rejects a value that is not a File", () => {
    expect(validateAvatarFile("no-soy-un-archivo")).toBe("Seleccioná una imagen");
  });

  it("rejects an empty file", () => {
    expect(validateAvatarFile(fileOf("foto.png", "image/png", 0))).toBe("Seleccioná una imagen");
  });

  it("rejects a disallowed mime type", () => {
    expect(validateAvatarFile(fileOf("doc.pdf", "application/pdf", 1024))).toBe(
      "Formato no permitido. Usá JPG, PNG, WebP o HEIC",
    );
  });

  it("rejects a file larger than 5 MiB", () => {
    expect(validateAvatarFile(fileOf("grande.jpg", "image/jpeg", AVATAR_MAX_BYTES + 1))).toBe(
      "La imagen no puede superar los 5 MB",
    );
  });

  it("accepts a file exactly at the size limit", () => {
    expect(validateAvatarFile(fileOf("justo.jpg", "image/jpeg", AVATAR_MAX_BYTES))).toBeNull();
  });

  it.each(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"])(
    "accepts %s",
    (type) => {
      expect(validateAvatarFile(fileOf("foto", type, 2048))).toBeNull();
    },
  );
});

describe("sniffImageType", () => {
  it("detects JPEG", () => {
    expect(sniffImageType(bytesOf(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10))).toBe("image/jpeg");
  });

  it("detects PNG", () => {
    expect(sniffImageType(bytesOf(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00))).toBe(
      "image/png",
    );
  });

  it("detects WebP", () => {
    expect(
      sniffImageType(bytesOf(...ascii("RIFF"), 0x24, 0x00, 0x00, 0x00, ...ascii("WEBP"))),
    ).toBe("image/webp");
  });

  it.each(["heic", "heix", "heim", "heis", "mif1", "msf1"])("detects HEIC brand %s", (brand) => {
    expect(sniffImageType(bytesOf(0x00, 0x00, 0x00, 0x20, ...ascii("ftyp"), ...ascii(brand)))).toBe(
      "image/heic",
    );
  });

  it("does not confuse AVIF with HEIC", () => {
    expect(
      sniffImageType(bytesOf(0x00, 0x00, 0x00, 0x20, ...ascii("ftyp"), ...ascii("avif"))),
    ).toBeNull();
  });

  it("rejects a RIFF container that is not WebP", () => {
    expect(
      sniffImageType(bytesOf(...ascii("RIFF"), 0x24, 0x00, 0x00, 0x00, ...ascii("WAVE"))),
    ).toBeNull();
  });

  it("rejects an executable renamed as an image", () => {
    expect(sniffImageType(bytesOf(0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00))).toBeNull();
  });

  it("rejects bytes too short to hold any signature", () => {
    expect(sniffImageType(bytesOf(0xff, 0xd8))).toBeNull();
  });
});

describe("avatarObjectPath", () => {
  it("puts the object inside a folder named after the user id", () => {
    expect(avatarObjectPath("user-1", "image/png")).toMatch(
      /^user-1\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/,
    );
  });

  it.each([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ])("maps %s to the .%s extension", (mime, ext) => {
    expect(avatarObjectPath("user-1", mime).endsWith(`.${ext}`)).toBe(true);
  });

  it("generates a different path on every call", () => {
    expect(avatarObjectPath("user-1", "image/png")).not.toBe(
      avatarObjectPath("user-1", "image/png"),
    );
  });
});

describe("avatarPathFromPublicUrl", () => {
  const base = `https://proj.supabase.co/storage/v1/object/public/${AVATAR_BUCKET}`;

  it("extracts the object path from a public avatar url", () => {
    expect(avatarPathFromPublicUrl(`${base}/user-1/abc.png`)).toBe("user-1/abc.png");
  });

  it("ignores the query string", () => {
    expect(avatarPathFromPublicUrl(`${base}/user-1/abc.png?v=123`)).toBe("user-1/abc.png");
  });

  it("returns null for null", () => {
    expect(avatarPathFromPublicUrl(null)).toBeNull();
  });

  it("returns null for a url from another bucket", () => {
    expect(
      avatarPathFromPublicUrl(
        "https://proj.supabase.co/storage/v1/object/public/otros/user-1/a.png",
      ),
    ).toBeNull();
  });

  it("returns null for an external url", () => {
    expect(avatarPathFromPublicUrl("https://gravatar.com/avatar/abc.png")).toBeNull();
  });

  it("returns null for a malformed url", () => {
    expect(avatarPathFromPublicUrl("no-es-una-url")).toBeNull();
  });
});
