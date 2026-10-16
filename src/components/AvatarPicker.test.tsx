import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AvatarPicker } from "./AvatarPicker";

afterEach(() => {
  vi.unstubAllEnvs();
});

function jpeg(name = "foto.jpg") {
  return new File([new Uint8Array([0xff, 0xd8, 0xff])], name, { type: "image/jpeg" });
}

function fileInputs(): HTMLInputElement[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>('input[type="file"]'));
}

/** The gallery/files input: the one without `capture`. */
function fileInput(): HTMLInputElement {
  const input = fileInputs().find((el) => !el.hasAttribute("capture"));
  if (!input) throw new Error("no file input");
  return input;
}

function cameraInput(): HTMLInputElement {
  const input = fileInputs().find((el) => el.getAttribute("capture") === "user");
  if (!input) throw new Error("no camera input");
  return input;
}

// jsdom doesn't allow assigning `files` directly, so we define it by hand
// before firing change, which is what the browser does when a file is picked.
function choose(file: File, input: HTMLInputElement = fileInput()) {
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  fireEvent.change(input);
}

describe("AvatarPicker", () => {
  it("shows the camera placeholder and the two pill buttons when there is no photo", () => {
    render(<AvatarPicker action={vi.fn()} />);

    const upload = screen.getByRole("button", { name: "Subir foto" });
    const camera = screen.getByRole("button", { name: "Sacar foto" });
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.queryByRole("img")).toBeNull();
    // The circle is a non-interactive image; icons are decorative.
    expect(document.querySelector("span.size-25 svg.lucide")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(upload.querySelector("svg.lucide")).toHaveAttribute("aria-hidden", "true");
    expect(camera.querySelector("svg.lucide")).toHaveAttribute("aria-hidden", "true");
  });

  it("extends both pill buttons' hit area to 44px without growing them", () => {
    render(<AvatarPicker action={vi.fn()} />);

    for (const name of ["Subir foto", "Sacar foto"]) {
      const button = screen.getByRole("button", { name });
      expect(button).toHaveClass(
        "relative",
        "after:absolute",
        "after:-inset-y-[3px]",
        "after:inset-x-0",
        'after:content-[""]',
        "h-10",
      );
      expect(button).not.toHaveClass("after:-inset-y-0.5");
    }
  });

  it("renders the error as a full-width, left-aligned bar", async () => {
    const action = vi.fn().mockResolvedValue({ error: "Algo salió mal" });
    render(<AvatarPicker action={action} />);

    choose(jpeg());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveClass("self-stretch", "text-left");
  });

  it("keeps both file inputs out of the tab order and out of the a11y tree", () => {
    render(<AvatarPicker action={vi.fn()} />);

    expect(fileInputs()).toHaveLength(2);
    for (const input of fileInputs()) {
      expect(input).toHaveAttribute("tabindex", "-1");
      expect(input).toHaveAttribute("aria-hidden", "true");
      expect(input).toHaveClass("sr-only");
    }
  });

  it("opens the input without capture from 'Subir foto'", () => {
    render(<AvatarPicker action={vi.fn()} />);
    const gallery = vi.spyOn(fileInput(), "click");
    const camera = vi.spyOn(cameraInput(), "click");

    fireEvent.click(screen.getByRole("button", { name: "Subir foto" }));

    expect(gallery).toHaveBeenCalledTimes(1);
    expect(camera).not.toHaveBeenCalled();
    expect(fileInput()).not.toHaveAttribute("capture");
  });

  it("opens the capture='user' input from 'Sacar foto'", () => {
    render(<AvatarPicker action={vi.fn()} />);
    const gallery = vi.spyOn(fileInput(), "click");
    const camera = vi.spyOn(cameraInput(), "click");

    fireEvent.click(screen.getByRole("button", { name: "Sacar foto" }));

    expect(camera).toHaveBeenCalledTimes(1);
    expect(gallery).not.toHaveBeenCalled();
  });

  it("renders the hint under the circle when given", () => {
    render(<AvatarPicker action={vi.fn()} hint="Necesitamos una foto clara." />);

    expect(screen.getByText("Necesitamos una foto clara.")).toBeInTheDocument();
  });

  it("renders no hint by default", () => {
    const { container } = render(<AvatarPicker action={vi.fn()} />);

    expect(container.querySelector("p")).toBeNull();
  });

  it("shows the current photo when initialUrl is set", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://sb.test");
    render(
      <AvatarPicker
        action={vi.fn()}
        initialUrl="https://sb.test/storage/v1/object/public/avatars/u/a.jpg"
      />,
    );

    expect(screen.getByRole("img", { name: "Foto de perfil" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subir foto" })).toBeInTheDocument();
  });

  it("falls back to the camera placeholder when initialUrl host is outside remotePatterns", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    render(
      <AvatarPicker
        action={vi.fn()}
        initialUrl="https://other.supabase.co/storage/v1/object/public/avatars/u/a.jpg"
      />,
    );

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByRole("button", { name: "Subir foto" })).toBeInTheDocument();
  });

  it("falls back when NEXT_PUBLIC_SUPABASE_URL is missing and initialUrl is absolute", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    render(
      <AvatarPicker
        action={vi.fn()}
        initialUrl="https://abc.supabase.co/storage/v1/object/public/avatars/u/a.jpg"
      />,
    );

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByRole("button", { name: "Subir foto" })).toBeInTheDocument();
  });

  it("accepts the mime types the upload pipeline supports", () => {
    render(<AvatarPicker action={vi.fn()} />);
    const input = fileInput();

    expect(input).toHaveAttribute("name", "avatar");
    expect(input.accept).toBe("image/jpeg,image/png,image/webp,image/heic,image/heif");
  });

  it("sends the chosen file to the action as FormData under 'avatar'", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://sb.test");
    const action = vi.fn().mockResolvedValue({
      avatarUrl: "https://sb.test/storage/v1/object/public/avatars/u/new.jpg",
    });
    render(<AvatarPicker action={action} />);

    choose(jpeg());

    await waitFor(() => expect(action).toHaveBeenCalled());
    const formData = action.mock.calls[0][1] as FormData;
    const sent = formData.get("avatar") as File;
    expect(sent.name).toBe("foto.jpg");
  });

  it("renders the uploaded photo returned by the action", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://sb.test");
    const action = vi.fn().mockResolvedValue({
      avatarUrl: "https://sb.test/storage/v1/object/public/avatars/u/new.jpg",
    });
    render(<AvatarPicker action={action} />);

    choose(jpeg());

    expect(await screen.findByRole("img", { name: "Foto de perfil" })).toBeInTheDocument();
  });

  it("falls back to the camera placeholder when the image request fails after render", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://sb.test");
    render(
      <AvatarPicker
        action={vi.fn()}
        initialUrl="https://sb.test/storage/v1/object/public/avatars/u/a.jpg"
      />,
    );

    const img = screen.getByRole("img", { name: "Foto de perfil" });
    fireEvent.error(img);

    expect(screen.queryByRole("img")).toBeNull();
    expect(document.querySelector("span.size-25 svg.lucide")).toBeTruthy();
  });

  it("shows the error returned by the action and keeps the placeholder", async () => {
    const action = vi.fn().mockResolvedValue({ error: "La imagen no puede superar los 5 MB" });
    render(<AvatarPicker action={action} />);

    choose(jpeg());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La imagen no puede superar los 5 MB",
    );
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("rejects an oversized photo locally instead of surfacing a connection error", async () => {
    // Next aborts server-action bodies above bodySizeLimit (6 MB) before the
    // action runs, so the client sees a rejected promise, not our 5 MB error.
    const action = vi.fn().mockRejectedValue(new Error("Body exceeded 6mb limit"));
    render(<AvatarPicker action={action} />);
    const huge = new File([new Uint8Array(7 * 1024 * 1024)], "camara.jpg", {
      type: "image/jpeg",
    });

    choose(huge);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La imagen no puede superar los 5 MB",
    );
    expect(action).not.toHaveBeenCalled();
    for (const button of screen.getAllByRole("button")) expect(button).toBeEnabled();
  });

  it("clears the local error when another file is chosen", async () => {
    const action = vi.fn().mockResolvedValue({
      avatarUrl: "https://sb.test/storage/v1/object/public/avatars/u/new.jpg",
    });
    render(<AvatarPicker action={action} />);

    choose(new File([new Uint8Array(7 * 1024 * 1024)], "grande.jpg", { type: "image/jpeg" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    choose(jpeg("chica.jpg"), cameraInput());

    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    await waitFor(() => expect(action).toHaveBeenCalled());
  });

  it("sends photos taken with the camera input too", async () => {
    const action = vi.fn().mockResolvedValue({ error: "x" });
    render(<AvatarPicker action={action} />);

    choose(jpeg("selfie.jpg"), cameraInput());

    await waitFor(() => expect(action).toHaveBeenCalled());
    expect(((action.mock.calls[0][1] as FormData).get("avatar") as File).name).toBe("selfie.jpg");
  });

  it("keeps the photo already uploaded when a later upload fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://sb.test");
    const action = vi
      .fn()
      .mockResolvedValueOnce({
        avatarUrl: "https://sb.test/storage/v1/object/public/avatars/u/new.jpg",
      })
      .mockResolvedValueOnce({ error: "Formato no permitido. Usá JPG, PNG, WebP o HEIC" });
    render(<AvatarPicker action={action} />);

    choose(jpeg());
    expect(await screen.findByRole("img", { name: "Foto de perfil" })).toBeInTheDocument();

    choose(jpeg("otra.jpg"));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    // The photo stays saved on the profile: removing it from the UI would lie.
    expect(screen.getByRole("img", { name: "Foto de perfil" })).toBeInTheDocument();
  });

  it("blocks both inputs and both buttons while an upload is in flight", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://sb.test");
    let resolve: (state: { avatarUrl: string }) => void = () => {};
    const action = vi.fn().mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    render(<AvatarPicker action={action} />);

    choose(jpeg());

    await waitFor(() => expect(fileInput()).toBeDisabled());
    expect(cameraInput()).toBeDisabled();
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
    expect(screen.getByRole("button", { name: "Sacar foto" })).toBeDisabled();

    resolve({ avatarUrl: "https://sb.test/storage/v1/object/public/avatars/u/new.jpg" });
    await waitFor(() => expect(fileInput()).not.toBeDisabled());
    expect(cameraInput()).not.toBeDisabled();
  });

  it("reports the upload state to the parent", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://sb.test");
    const onUploadingChange = vi.fn();
    const action = vi.fn().mockResolvedValue({
      avatarUrl: "https://sb.test/storage/v1/object/public/avatars/u/new.jpg",
    });
    render(<AvatarPicker action={action} onUploadingChange={onUploadingChange} />);

    choose(jpeg());

    await waitFor(() => expect(onUploadingChange).toHaveBeenCalledWith(true));
    await waitFor(() => expect(onUploadingChange).toHaveBeenLastCalledWith(false));
  });

  it("shows 'Subiendo...' and a busy circle while the upload is in flight", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://sb.test");
    let resolve: (state: { avatarUrl: string }) => void = () => {};
    const action = vi.fn().mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    render(<AvatarPicker action={action} />);

    choose(jpeg());

    expect(await screen.findByText("Subiendo...")).toBeInTheDocument();
    expect(document.querySelector("svg.animate-spin")).toBeTruthy();
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();

    resolve({ avatarUrl: "https://sb.test/storage/v1/object/public/avatars/u/new.jpg" });
    await waitFor(() => expect(screen.queryByText("Subiendo...")).toBeNull());
  });
});
