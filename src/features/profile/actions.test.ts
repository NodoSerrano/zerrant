import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesUpdate: vi.fn(),
  profilesUpdateEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  profileRolesDelete: vi.fn(),
  profileRolesDeleteEq: vi.fn(),
  profileRolesInsert: vi.fn(),
  storageUpload: vi.fn(),
  storageGetPublicUrl: vi.fn(),
  storageRemove: vi.fn(),
  ensureWebSafeImage: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      if (table === "profile_roles") {
        return {
          delete: mocks.profileRolesDelete.mockImplementation(() => ({
            eq: mocks.profileRolesDeleteEq,
          })),
          insert: mocks.profileRolesInsert,
        };
      }
      return {
        update: mocks.profilesUpdate.mockImplementation(() => ({
          eq: mocks.profilesUpdateEq,
        })),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: mocks.profilesSelectSingle })),
        })),
      };
    }),
    storage: {
      from: vi.fn(() => ({
        upload: mocks.storageUpload,
        getPublicUrl: mocks.storageGetPublicUrl,
        remove: mocks.storageRemove,
      })),
    },
  }),
}));

// La conversión real tiene su propio test en avatar-convert.test.ts; acá sólo
// verificamos que la action la use.
vi.mock("./avatar-convert", () => ({ ensureWebSafeImage: mocks.ensureWebSafeImage }));

// revalidatePath necesita el store de Next, que no existe fuera de un request.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { saveOnboardingStep1, saveOnboardingStep2, updateProfile, uploadAvatar } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("saveOnboardingStep1", () => {
  it("updates profile and redirects on success", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

    const fd = new FormData();
    fd.set("nombre", "Juan");
    fd.set("apellido", "Pérez");
    fd.set("apodo", "juancito");
    fd.set("nombre_visible", "nombre_apellido");
    fd.set("fecha_nacimiento", "1990-01-15");

    try {
      await saveOnboardingStep1(null, fd);
    } catch {
      // redirect throws
    }

    expect(mocks.profilesUpdate).toHaveBeenCalledWith({
      nombre: "Juan",
      apellido: "Pérez",
      apodo: "juancito",
      nombre_visible: "nombre_apellido",
      fecha_nacimiento: "1990-01-15",
    });
    expect(mocks.profilesUpdateEq).toHaveBeenCalledWith("id", "test-user-id");
  });

  it("omits nombre_visible when the form does not send it", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

    const fd = new FormData();
    fd.set("nombre", "Juan");
    fd.set("apellido", "Pérez");
    fd.set("fecha_nacimiento", "1990-01-15");

    try {
      await saveOnboardingStep1(null, fd);
    } catch {
      // redirect throws
    }

    expect(mocks.profilesUpdate).toHaveBeenCalledWith({
      nombre: "Juan",
      apellido: "Pérez",
      apodo: null,
      fecha_nacimiento: "1990-01-15",
    });
  });

  it.each(["nombre", "apellido", "fecha_nacimiento"])(
    "rejects without touching the DB when %s is missing",
    async (missing) => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });

      const fd = new FormData();
      fd.set("nombre", "Juan");
      fd.set("apellido", "Pérez");
      fd.set("fecha_nacimiento", "1990-01-15");
      fd.delete(missing);

      const result = await saveOnboardingStep1(null, fd);

      expect(result).toEqual({ error: "Completá nombre, apellido y fecha de nacimiento" });
      expect(mocks.profilesUpdate).not.toHaveBeenCalled();
    },
  );

  it("rejects when a required field is only whitespace", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });

    const fd = new FormData();
    fd.set("nombre", "   ");
    fd.set("apellido", "Pérez");
    fd.set("fecha_nacimiento", "1990-01-15");

    const result = await saveOnboardingStep1(null, fd);

    expect(result).toEqual({ error: "Completá nombre, apellido y fecha de nacimiento" });
    expect(mocks.profilesUpdate).not.toHaveBeenCalled();
  });

  it("returns error when supabase update fails", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesUpdateEq.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    const fd = new FormData();
    fd.set("nombre", "Juan");
    fd.set("apellido", "Pérez");
    fd.set("fecha_nacimiento", "1990-01-15");
    fd.set("nombre_visible", "nombre_apellido");

    const result = await saveOnboardingStep1(null, fd);

    expect(result).toEqual({ error: "No pudimos guardar tus datos. Probá de nuevo." });
  });

  it("returns error when user is not authenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await saveOnboardingStep1(null, new FormData());

    expect(result).toEqual({ error: "No autorizado" });
  });

  it.each(["ayer", "1990-13-45", "90-01-15", "3000-01-01"])(
    "rejects %s as fecha de nacimiento without touching the DB",
    async (fecha) => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });

      const fd = new FormData();
      fd.set("nombre", "Juan");
      fd.set("apellido", "Pérez");
      fd.set("fecha_nacimiento", fecha);

      const result = await saveOnboardingStep1(null, fd);

      expect(result).toEqual({ error: "Ingresá una fecha de nacimiento válida" });
      expect(mocks.profilesUpdate).not.toHaveBeenCalled();
    },
  );

  it("ignores a nombre_visible that is not one of the enum values", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

    const fd = new FormData();
    fd.set("nombre", "Juan");
    fd.set("apellido", "Pérez");
    fd.set("fecha_nacimiento", "1990-01-15");
    fd.set("nombre_visible", "drop table profiles");

    try {
      await saveOnboardingStep1(null, fd);
    } catch {
      // redirect throws
    }

    expect(mocks.profilesUpdate.mock.calls[0][0]).not.toHaveProperty("nombre_visible");
  });
});

describe("saveOnboardingStep2", () => {
  function step1Saved() {
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { nombre: "Juan", apellido: "Pérez", fecha_nacimiento: "1990-01-15" },
      error: null,
    });
  }

  it("does not close the onboarding when step 1 was never saved", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { nombre: null, apellido: null, fecha_nacimiento: null },
      error: null,
    });

    try {
      await saveOnboardingStep2(null, new FormData());
    } catch {
      // redirect throws
    }

    expect(mocks.profilesUpdate).not.toHaveBeenCalled();
  });

  it("updates profile and redirects on success", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    step1Saved();
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

    const fd = new FormData();
    fd.set("bio", "Hello I am Juan");
    fd.set("contacto_telegram", "@juan");
    fd.set("sitio_url", "https://example.com");

    try {
      await saveOnboardingStep2(null, fd);
    } catch {
      // redirect throws
    }

    expect(mocks.profilesUpdate).toHaveBeenCalledWith({
      bio: "Hello I am Juan",
      contacto_telegram: "@juan",
      sitio_url: "https://example.com",
      onboarding_completado_en: expect.any(String),
    });
    expect(mocks.profilesUpdateEq).toHaveBeenCalledWith("id", "test-user-id");
  });

  it("closes the onboarding by stamping onboarding_completado_en", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    step1Saved();
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

    try {
      await saveOnboardingStep2(null, new FormData());
    } catch {
      // redirect throws
    }

    const update = mocks.profilesUpdate.mock.calls[0][0];
    expect(Date.parse(update.onboarding_completado_en)).not.toBeNaN();
  });

  it("returns error when supabase update fails", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    step1Saved();
    mocks.profilesUpdateEq.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    const result = await saveOnboardingStep2(null, new FormData());

    expect(result).toEqual({ error: "No pudimos guardar tus datos. Probá de nuevo." });
  });

  it("returns error when user is not authenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await saveOnboardingStep2(null, new FormData());

    expect(result).toEqual({ error: "No autorizado" });
  });
});

describe("updateProfile", () => {
  it("updates profile with numeric tarifa_hora and redirects on success", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profileRolesDeleteEq.mockResolvedValue({ data: null, error: null });
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

    const fd = new FormData();
    fd.set("nombre", "Juan");
    fd.set("apellido", "Pérez");
    fd.set("apodo", "juancito");
    fd.set("nombre_visible", "nombre_apellido");
    fd.set("fecha_nacimiento", "1990-01-15");
    fd.set("bio", "Hello");
    fd.set("contacto_telegram", "@juan");
    fd.set("sitio_url", "https://example.com");
    fd.set("disponibilidad", "full_time");
    fd.set("visibilidad_tarifa", "publica");
    fd.set("tarifa_hora", "50");

    try {
      await updateProfile(null, fd);
    } catch {
      // redirect throws
    }

    expect(mocks.profilesUpdate).toHaveBeenCalledWith({
      nombre: "Juan",
      apellido: "Pérez",
      apodo: "juancito",
      nombre_visible: "nombre_apellido",
      fecha_nacimiento: "1990-01-15",
      bio: "Hello",
      contacto_telegram: "@juan",
      sitio_url: "https://example.com",
      disponibilidad: "full_time",
      visibilidad_tarifa: "publica",
      tarifa_hora: 50,
    });
    expect(mocks.profilesUpdateEq).toHaveBeenCalledWith("id", "test-user-id");
  });

  it("returns error when supabase update fails", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profileRolesDeleteEq.mockResolvedValue({ data: null, error: null });
    mocks.profilesUpdateEq.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    const result = await updateProfile(null, new FormData());

    expect(result).toEqual({ error: "No pudimos guardar tus datos. Probá de nuevo." });
  });
});

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const HEIC_BYTES = new Uint8Array([
  0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63,
]);
const PUBLIC_URL = "https://proj.supabase.co/storage/v1/object/public/avatars/test-user-id/new.png";

function avatarForm(bytes: Uint8Array, name: string, type: string): FormData {
  const fd = new FormData();
  fd.set("avatar", new File([bytes as BlobPart], name, { type }));
  return fd;
}

function happyPath() {
  mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
  mocks.ensureWebSafeImage.mockImplementation(async (bytes: Uint8Array, mime: string) => ({
    bytes,
    mime,
  }));
  mocks.storageUpload.mockResolvedValue({ data: { path: "x" }, error: null });
  mocks.storageGetPublicUrl.mockReturnValue({ data: { publicUrl: PUBLIC_URL } });
  mocks.profilesSelectSingle.mockResolvedValue({ data: { avatar_url: null }, error: null });
  mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });
  mocks.storageRemove.mockResolvedValue({ data: null, error: null });
}

describe("uploadAvatar", () => {
  it("returns error when user is not authenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await uploadAvatar(null, avatarForm(PNG_BYTES, "foto.png", "image/png"));

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.storageUpload).not.toHaveBeenCalled();
  });

  it("returns error when no file was provided", async () => {
    happyPath();

    const result = await uploadAvatar(null, new FormData());

    expect(result).toEqual({ error: "Seleccioná una imagen" });
    expect(mocks.storageUpload).not.toHaveBeenCalled();
  });

  it("rejects a disallowed mime type without touching storage", async () => {
    happyPath();

    const result = await uploadAvatar(null, avatarForm(PNG_BYTES, "doc.pdf", "application/pdf"));

    expect(result).toEqual({ error: "Formato no permitido. Usá JPG, PNG, WebP o HEIC" });
    expect(mocks.storageUpload).not.toHaveBeenCalled();
  });

  it("rejects a file whose bytes are not really an image", async () => {
    happyPath();
    const notAnImage = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0, 0, 0, 4, 0, 0, 0]);

    const result = await uploadAvatar(null, avatarForm(notAnImage, "virus.png", "image/png"));

    expect(result).toEqual({ error: "El archivo no es una imagen válida" });
    expect(mocks.storageUpload).not.toHaveBeenCalled();
  });

  it("uploads the image and persists avatar_url", async () => {
    happyPath();

    const result = await uploadAvatar(null, avatarForm(PNG_BYTES, "foto.png", "image/png"));

    expect(mocks.storageUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^test-user-id\/[0-9a-f-]{36}\.png$/),
      expect.any(Uint8Array),
      expect.objectContaining({ contentType: "image/png", upsert: false }),
    );
    expect(mocks.profilesUpdate).toHaveBeenCalledWith({ avatar_url: PUBLIC_URL });
    expect(mocks.profilesUpdateEq).toHaveBeenCalledWith("id", "test-user-id");
    expect(result).toEqual({ avatarUrl: PUBLIC_URL });
  });

  it("converts HEIC to JPEG before uploading", async () => {
    happyPath();
    mocks.ensureWebSafeImage.mockResolvedValue({
      bytes: new Uint8Array([1, 2, 3]),
      mime: "image/jpeg",
    });

    await uploadAvatar(null, avatarForm(HEIC_BYTES, "foto.heic", "image/heic"));

    expect(mocks.ensureWebSafeImage).toHaveBeenCalledWith(expect.any(Uint8Array), "image/heic");
    expect(mocks.storageUpload).toHaveBeenCalledWith(
      expect.stringMatching(/\.jpg$/),
      expect.any(Uint8Array),
      expect.objectContaining({ contentType: "image/jpeg" }),
    );
  });

  it("returns the conversion error when HEIC cannot be decoded", async () => {
    happyPath();
    mocks.ensureWebSafeImage.mockRejectedValue(new Error("No pudimos procesar la imagen HEIC"));

    const result = await uploadAvatar(null, avatarForm(HEIC_BYTES, "foto.heic", "image/heic"));

    expect(result).toEqual({ error: "No pudimos procesar la imagen HEIC" });
    expect(mocks.storageUpload).not.toHaveBeenCalled();
  });

  it("returns error and skips the db write when the upload fails", async () => {
    happyPath();
    mocks.storageUpload.mockResolvedValue({ data: null, error: { message: "Storage lleno" } });

    const result = await uploadAvatar(null, avatarForm(PNG_BYTES, "foto.png", "image/png"));

    expect(result).toEqual({ error: "No pudimos guardar la imagen. Probá de nuevo." });
    expect(mocks.profilesUpdate).not.toHaveBeenCalled();
  });

  it("removes the orphan object when the profile update fails", async () => {
    happyPath();
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const result = await uploadAvatar(null, avatarForm(PNG_BYTES, "foto.png", "image/png"));

    expect(result).toEqual({ error: "No pudimos guardar tus datos. Probá de nuevo." });
    expect(mocks.storageRemove).toHaveBeenCalledWith([
      expect.stringMatching(/^test-user-id\/[0-9a-f-]{36}\.png$/),
    ]);
  });

  it("deletes the previous avatar object after a successful replacement", async () => {
    happyPath();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: {
        avatar_url:
          "https://proj.supabase.co/storage/v1/object/public/avatars/test-user-id/old.png",
      },
      error: null,
    });

    await uploadAvatar(null, avatarForm(PNG_BYTES, "foto.png", "image/png"));

    expect(mocks.storageRemove).toHaveBeenCalledWith(["test-user-id/old.png"]);
  });

  it("does not try to delete an avatar hosted outside our bucket", async () => {
    happyPath();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { avatar_url: "https://gravatar.com/avatar/abc.png" },
      error: null,
    });

    await uploadAvatar(null, avatarForm(PNG_BYTES, "foto.png", "image/png"));

    expect(mocks.storageRemove).not.toHaveBeenCalled();
  });
});
