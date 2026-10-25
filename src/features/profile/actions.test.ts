import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesUpdate: vi.fn(),
  profilesUpdateEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  storageUpload: vi.fn(),
  storageGetPublicUrl: vi.fn(),
  storageRemove: vi.fn(),
  ensureWebSafeImage: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn(() => ({
      update: mocks.profilesUpdate.mockImplementation(() => ({
        eq: mocks.profilesUpdateEq,
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: mocks.profilesSelectSingle })),
      })),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: mocks.storageUpload,
        getPublicUrl: mocks.storageGetPublicUrl,
        remove: mocks.storageRemove,
      })),
    },
  }),
}));

// Real conversion has its own test in avatar-convert.test.ts; here we only
// verify that the action uses it.
vi.mock("./avatar-convert", () => ({ ensureWebSafeImage: mocks.ensureWebSafeImage }));

// revalidatePath needs Next's store, which doesn't exist outside a request.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const pipelineMock = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("@/features/membership/pipeline-server", () => ({
  loadMembershipPipeline: pipelineMock.load,
}));

const cookieJar = vi.hoisted(() => ({ flow: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "ns_flujo" && cookieJar.flow ? { value: cookieJar.flow } : undefined,
  }),
}));

import { removeAvatar, saveOnboardingStep1, updateProfile, uploadAvatar } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  cookieJar.flow = undefined;
});

function redirectPath(error: unknown): string | undefined {
  const digest = (error as { digest?: string } | undefined)?.digest;
  if (!digest?.startsWith("NEXT_REDIRECT")) return undefined;
  return digest.split(";")[2];
}

/** Step 1 closes onboarding: success is a redirect, not a returned state. */
async function runStep1(fd: FormData): Promise<string> {
  try {
    const result = await saveOnboardingStep1(null, fd);
    throw new Error(`expected redirect, got ${JSON.stringify(result)}`);
  } catch (error) {
    const path = redirectPath(error);
    if (path) return path;
    throw error;
  }
}

function requiredIdentity(): FormData {
  const fd = new FormData();
  fd.set("nombre", "Juan");
  fd.set("apellido", "Pérez");
  fd.set("fecha_nacimiento", "1990-01-15");
  return fd;
}

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

    expect(await runStep1(fd)).toBe("/profile");

    expect(mocks.profilesUpdate).toHaveBeenCalledWith({
      nombre: "Juan",
      apellido: "Pérez",
      apodo: "juancito",
      nombre_visible: "nombre_apellido",
      fecha_nacimiento: "1990-01-15",
      onboarding_completado_en: expect.any(String),
    });
    expect(mocks.profilesUpdateEq).toHaveBeenCalledWith("id", "test-user-id");
  });

  it("closes onboarding with only nombre, apellido and fecha de nacimiento", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

    expect(await runStep1(requiredIdentity())).toBe("/profile");

    const update = mocks.profilesUpdate.mock.calls[0][0];
    expect(update).toMatchObject({
      nombre: "Juan",
      apellido: "Pérez",
      fecha_nacimiento: "1990-01-15",
    });
    expect(Date.parse(update.onboarding_completado_en)).not.toBeNaN();
    expect(update).not.toHaveProperty("bio");
    expect(update).not.toHaveProperty("contacto_telegram");
    expect(update).not.toHaveProperty("sitio_url");
  });

  it("accepts blank optional fields and stores them as null", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

    const fd = requiredIdentity();
    fd.set("bio", "   ");
    fd.set("contacto_telegram", "");
    fd.set("sitio_url", "  ");

    expect(await runStep1(fd)).toBe("/profile");
    expect(mocks.profilesUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        bio: null,
        contacto_telegram: null,
        sitio_url: null,
        onboarding_completado_en: expect.any(String),
      }),
    );
  });

  it("persists optional fields when the form submits them", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

    const fd = requiredIdentity();
    fd.set("bio", "  Hola  ");
    fd.set("contacto_telegram", "  @juan  ");
    fd.set("sitio_url", "  https://example.com  ");

    expect(await runStep1(fd)).toBe("/profile");
    expect(mocks.profilesUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        bio: "Hola",
        contacto_telegram: "@juan",
        sitio_url: "https://example.com",
      }),
    );
  });

  it("omits nombre_visible when the form does not send it", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

    const fd = new FormData();
    fd.set("nombre", "Juan");
    fd.set("apellido", "Pérez");
    fd.set("fecha_nacimiento", "1990-01-15");

    expect(await runStep1(fd)).toBe("/profile");

    expect(mocks.profilesUpdate).toHaveBeenCalledWith({
      nombre: "Juan",
      apellido: "Pérez",
      fecha_nacimiento: "1990-01-15",
      onboarding_completado_en: expect.any(String),
    });
  });

  // The form does render the apodo input, so an emptied one arrives as "" and
  // must clear the column: only a field the form never sends is left alone.
  it("clears apodo when the form sends it empty", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

    const fd = new FormData();
    fd.set("nombre", "Juan");
    fd.set("apellido", "Pérez");
    fd.set("apodo", "   ");
    fd.set("fecha_nacimiento", "1990-01-15");

    expect(await runStep1(fd)).toBe("/profile");

    expect(mocks.profilesUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ apodo: null, onboarding_completado_en: expect.any(String) }),
    );
  });

  it.each(["nombre", "apellido", "fecha_nacimiento"])(
    "rejects without touching the DB or stamping onboarding when %s is missing",
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

  it("capitalizes nombre and apellido with particles (ZER-139)", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

    const fd = new FormData();
    fd.set("nombre", "maría josé");
    fd.set("apellido", "de la cruz");
    fd.set("fecha_nacimiento", "1990-01-15");

    try {
      await saveOnboardingStep1(null, fd);
    } catch {
      // redirect throws
    }

    expect(mocks.profilesUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: "María José",
        apellido: "De la Cruz",
        fecha_nacimiento: "1990-01-15",
      }),
    );
  });

  it("does not title-case apodo (intentional casing)", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

    const fd = new FormData();
    fd.set("nombre", "Juan");
    fd.set("apellido", "Pérez");
    fd.set("apodo", "juaNcho");
    fd.set("fecha_nacimiento", "1990-01-15");

    try {
      await saveOnboardingStep1(null, fd);
    } catch {
      // redirect throws
    }

    expect(mocks.profilesUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ apodo: "juaNcho" }),
    );
  });

  // Identity, bio and contact belong here. A handcrafted POST must not reach
  // columns this form does not render.
  it.each([
    ["tarifa_hora", "5000"],
    ["disponibilidad", "ocupado"],
    ["visibilidad_tarifa", "publica"],
  ])("ignores %s, which does not belong to the profile step", async (field, value) => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

    const fd = new FormData();
    fd.set("nombre", "Juan");
    fd.set("apellido", "Pérez");
    fd.set("fecha_nacimiento", "1990-01-15");
    fd.set(field, value);

    expect(await runStep1(fd)).toBe("/profile");

    expect(mocks.profilesUpdate.mock.calls[0][0]).not.toHaveProperty(field);
  });

  it("ignores a nombre_visible that is not one of the enum values", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

    const fd = new FormData();
    fd.set("nombre", "Juan");
    fd.set("apellido", "Pérez");
    fd.set("fecha_nacimiento", "1990-01-15");
    fd.set("nombre_visible", "drop table profiles");

    expect(await runStep1(fd)).toBe("/profile");

    expect(mocks.profilesUpdate.mock.calls[0][0]).not.toHaveProperty("nombre_visible");
  });

  it("does not fail when an unowned tarifa_hora is invalid", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

    const fd = requiredIdentity();
    fd.set("tarifa_hora", "abc");

    expect(await runStep1(fd)).toBe("/profile");
    expect(mocks.profilesUpdate.mock.calls[0][0]).not.toHaveProperty("tarifa_hora");
  });
});

describe("updateProfile", () => {
  it("updates the identity fields and does not write availability or rates", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

    const fd = new FormData();
    fd.set("nombre", "Juan");
    fd.set("apellido", "Pérez");
    fd.set("apodo", "juancito");
    fd.set("nombre_visible", "nombre_apellido");
    fd.set("fecha_nacimiento", "1990-01-15");
    fd.set("disponibilidad", "disponible");
    fd.set("visibilidad_tarifa", "publica");
    fd.set("tarifa_hora", "50");
    fd.set("tarifa_dia", "400");

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
    });
    const update = mocks.profilesUpdate.mock.calls[0][0];
    expect(update).not.toHaveProperty("disponibilidad");
    expect(update).not.toHaveProperty("visibilidad_tarifa");
    expect(update).not.toHaveProperty("tarifa_hora");
    expect(update).not.toHaveProperty("tarifa_dia");
    expect(mocks.profilesUpdateEq).toHaveBeenCalledWith("id", "test-user-id");
  });

  it("returns error when supabase update fails", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesUpdateEq.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    const result = await updateProfile(null, new FormData());

    expect(result).toEqual({ error: "No pudimos guardar tus datos. Probá de nuevo." });
  });

  it("trims the text fields before persisting", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

    const fd = new FormData();
    fd.set("nombre", "  Juan  ");
    fd.set("apellido", "  Pérez  ");
    fd.set("apodo", "  juancito  ");
    fd.set("fecha_nacimiento", "1990-01-15");

    try {
      await updateProfile(null, fd);
    } catch {
      // redirect throws
    }

    expect(mocks.profilesUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: "Juan",
        apellido: "Pérez",
        apodo: "juancito",
      }),
    );
  });

  it("capitalizes nombre and apellido on edit (ZER-139)", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

    const fd = new FormData();
    fd.set("nombre", "maría josé");
    fd.set("apellido", "de la cruz");
    fd.set("fecha_nacimiento", "1990-01-15");

    try {
      await updateProfile(null, fd);
    } catch {
      // redirect throws
    }

    expect(mocks.profilesUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: "María José",
        apellido: "De la Cruz",
      }),
    );
  });

  // The edit form has no bio / telegram / sitio inputs: writing null for them
  // would wipe what onboarding step 2 saved.
  it.each(["bio", "contacto_telegram", "sitio_url"])(
    "leaves %s untouched when the form does not send it",
    async (absent) => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
      mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

      const fd = new FormData();
      fd.set("nombre", "Juan");
      fd.set("apellido", "Pérez");
      fd.set("fecha_nacimiento", "1990-01-15");

      try {
        await updateProfile(null, fd);
      } catch {
        // redirect throws
      }

      expect(mocks.profilesUpdate.mock.calls[0][0]).not.toHaveProperty(absent);
    },
  );

  // Both columns are NOT NULL with a default: sending null is a DB failure.
  it.each(["nombre_visible", "visibilidad_tarifa"])(
    "omits the NOT NULL enum %s when the form does not send it",
    async (enumField) => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
      mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

      const fd = new FormData();
      fd.set("nombre", "Juan");
      fd.set("apellido", "Pérez");
      fd.set("fecha_nacimiento", "1990-01-15");

      try {
        await updateProfile(null, fd);
      } catch {
        // redirect throws
      }

      expect(mocks.profilesUpdate.mock.calls[0][0]).not.toHaveProperty(enumField);
    },
  );

  it.each(["nombre_visible", "disponibilidad", "visibilidad_tarifa"])(
    "ignores a %s that is not one of the enum values",
    async (enumField) => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
      mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

      const fd = new FormData();
      fd.set("nombre", "Juan");
      fd.set("apellido", "Pérez");
      fd.set("fecha_nacimiento", "1990-01-15");
      fd.set(enumField, "drop table profiles");

      try {
        await updateProfile(null, fd);
      } catch {
        // redirect throws
      }

      expect(mocks.profilesUpdate.mock.calls[0][0]).not.toHaveProperty(enumField);
    },
  );

  it.each(["nombre", "apellido", "fecha_nacimiento"])(
    "rejects without touching the DB when %s is blanked out",
    async (blanked) => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });

      const fd = new FormData();
      fd.set("nombre", "Juan");
      fd.set("apellido", "Pérez");
      fd.set("fecha_nacimiento", "1990-01-15");
      fd.set(blanked, "   ");

      const result = await updateProfile(null, fd);

      expect(result).toEqual({ error: "Completá nombre, apellido y fecha de nacimiento" });
      expect(mocks.profilesUpdate).not.toHaveBeenCalled();
    },
  );

  it("rejects an invalid fecha de nacimiento without touching the DB", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });

    const fd = new FormData();
    fd.set("nombre", "Juan");
    fd.set("apellido", "Pérez");
    fd.set("fecha_nacimiento", "1990-13-45");

    const result = await updateProfile(null, fd);

    expect(result).toEqual({ error: "Ingresá una fecha de nacimiento válida" });
    expect(mocks.profilesUpdate).not.toHaveBeenCalled();
  });

  it.each(["abc", "-5", "0x10", "1e3", "Infinity", "1,5", "50", ""])(
    "ignores tarifa_hora value %s and still saves the profile",
    async (tarifa) => {
      mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
      mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });

      const fd = new FormData();
      fd.set("nombre", "Juan");
      fd.set("apellido", "Pérez");
      fd.set("fecha_nacimiento", "1990-01-15");
      fd.set("tarifa_hora", tarifa);

      try {
        await updateProfile(null, fd);
      } catch {
        // redirect throws
      }

      expect(mocks.profilesUpdate).toHaveBeenCalled();
      expect(mocks.profilesUpdate.mock.calls[0][0]).not.toHaveProperty("tarifa_hora");
    },
  );
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

  it("rejects a file over 5 MiB without touching storage", async () => {
    happyPath();
    const oversized = new Uint8Array(5 * 1024 * 1024 + 1);
    oversized.set(PNG_BYTES);

    const result = await uploadAvatar(null, avatarForm(oversized, "foto.png", "image/png"));

    expect(result).toEqual({ error: "La imagen no puede superar los 5 MB" });
    expect(mocks.storageUpload).not.toHaveBeenCalled();
  });

  it("stores the type sniffed from the bytes, not the one the client declares", async () => {
    happyPath();
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);

    await uploadAvatar(null, avatarForm(jpegBytes, "foto.png", "image/png"));

    expect(mocks.storageUpload).toHaveBeenCalledWith(
      expect.stringMatching(/\.jpg$/),
      expect.any(Uint8Array),
      expect.objectContaining({ contentType: "image/jpeg" }),
    );
  });

  it("rejects a converted image that ends up over 5 MiB without touching storage", async () => {
    happyPath();
    mocks.ensureWebSafeImage.mockResolvedValue({
      bytes: new Uint8Array(5 * 1024 * 1024 + 1),
      mime: "image/jpeg",
    });

    const result = await uploadAvatar(null, avatarForm(HEIC_BYTES, "foto.heic", "image/heic"));

    expect(result).toEqual({ error: "La imagen no puede superar los 5 MB" });
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

  it("never tries to delete an object outside the user's own folder", async () => {
    happyPath();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: {
        avatar_url:
          "https://proj.supabase.co/storage/v1/object/public/avatars/other-user-id/theirs.png",
      },
      error: null,
    });

    await uploadAvatar(null, avatarForm(PNG_BYTES, "foto.png", "image/png"));

    expect(mocks.storageRemove).not.toHaveBeenCalled();
  });
});

describe("saveOnboardingStep1 — membership flow (ZER-136)", () => {
  async function redirectTarget(): Promise<string> {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });
    return runStep1(requiredIdentity());
  }

  it("continues the pipeline straight to the resolved step, never via /unirme (bug-375)", async () => {
    cookieJar.flow = "membresia";
    pipelineMock.load.mockResolvedValue({
      hasSession: true,
      emailConfirmed: true,
      profile: {
        nombre: "Juan",
        apellido: "Pérez",
        fecha_nacimiento: "1990-01-15",
        onboarding_completado_en: "2026-10-06T00:00:00Z",
        tier: "tourist",
      },
      request: null,
      profileError: false,
      requestError: false,
    });

    const target = await redirectTarget();

    expect(target).toBe("/solicitar");
    expect(target).not.toBe("/unirme");
  });

  it("keeps the tourist path to /profile without the cookie", async () => {
    expect(await redirectTarget()).toBe("/profile");
  });

  it("ignores an unexpected cookie value", async () => {
    cookieJar.flow = "otra-cosa";
    expect(await redirectTarget()).toBe("/profile");
  });
});

describe("removeAvatar (ZER-212)", () => {
  const OWN_URL = "https://proj.supabase.co/storage/v1/object/public/avatars/test-user-id/old.png";

  function signedIn(avatarUrl: string | null) {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
    mocks.profilesSelectSingle.mockResolvedValue({ data: { avatar_url: avatarUrl }, error: null });
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });
    mocks.storageRemove.mockResolvedValue({ data: null, error: null });
  }

  it("returns error when user is not authenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await removeAvatar(null, new FormData());

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.profilesUpdate).not.toHaveBeenCalled();
  });

  it("clears avatar_url and deletes the user's own photo", async () => {
    signedIn(OWN_URL);

    const result = await removeAvatar(null, new FormData());

    expect(mocks.profilesUpdate).toHaveBeenCalledWith({ avatar_url: null });
    expect(mocks.profilesUpdateEq).toHaveBeenCalledWith("id", "test-user-id");
    expect(mocks.storageRemove).toHaveBeenCalledWith(["test-user-id/old.png"]);
    expect(result).toEqual({ avatarUrl: null });
  });

  it("never deletes a file outside the user's own folder", async () => {
    signedIn("https://proj.supabase.co/storage/v1/object/public/avatars/someone-else/x.png");

    await removeAvatar(null, new FormData());

    expect(mocks.profilesUpdate).toHaveBeenCalledWith({ avatar_url: null });
    expect(mocks.storageRemove).not.toHaveBeenCalled();
  });

  it("keeps the photo when the profile cannot be updated", async () => {
    signedIn(OWN_URL);
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: { message: "boom" } });

    const result = await removeAvatar(null, new FormData());

    expect(result).toEqual({ error: "No pudimos quitar la foto. Probá de nuevo." });
    expect(mocks.storageRemove).not.toHaveBeenCalled();
  });
});
