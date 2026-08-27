import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AvatarPicker } from "./AvatarPicker";

function jpeg(name = "foto.jpg") {
  return new File([new Uint8Array([0xff, 0xd8, 0xff])], name, { type: "image/jpeg" });
}

function fileInput(): HTMLInputElement {
  const input = document.querySelector('input[type="file"]');
  if (!input) throw new Error("no file input");
  return input as HTMLInputElement;
}

// jsdom doesn't allow assigning `files` directly, so we define it by hand
// before firing change, which is what the browser does when a file is picked.
function choose(file: File) {
  const input = fileInput();
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  fireEvent.change(input);
}

describe("AvatarPicker", () => {
  it("shows the camera placeholder and 'Agregar foto' when there is no photo", () => {
    render(<AvatarPicker action={vi.fn()} />);

    const trigger = screen.getByRole("button", { name: "Agregar foto" });
    expect(trigger).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
    // The icon is decorative: the button names it, not the svg.
    const icon = trigger.querySelector("svg.lucide");
    expect(icon).toBeTruthy();
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps the file input out of the tab order and out of the a11y tree", () => {
    render(<AvatarPicker action={vi.fn()} />);
    const input = fileInput();

    // The accessible control is the button; the duplicate input would only confuse.
    expect(input).toHaveAttribute("tabindex", "-1");
    expect(input).toHaveAttribute("aria-hidden", "true");
  });

  it("shows the current photo and 'Cambiar foto' when initialUrl is set", () => {
    render(<AvatarPicker action={vi.fn()} initialUrl="https://sb.test/avatars/u/a.jpg" />);

    expect(screen.getByRole("img", { name: "Foto de perfil" })).toBeInTheDocument();
    expect(screen.getByText("Cambiar foto")).toBeInTheDocument();
  });

  it("accepts the mime types the upload pipeline supports", () => {
    render(<AvatarPicker action={vi.fn()} />);
    const input = fileInput();

    expect(input).toHaveAttribute("name", "avatar");
    expect(input.accept).toBe("image/jpeg,image/png,image/webp,image/heic,image/heif");
  });

  it("sends the chosen file to the action as FormData under 'avatar'", async () => {
    const action = vi.fn().mockResolvedValue({ avatarUrl: "https://sb.test/avatars/u/new.jpg" });
    render(<AvatarPicker action={action} />);

    choose(jpeg());

    await waitFor(() => expect(action).toHaveBeenCalled());
    const formData = action.mock.calls[0][1] as FormData;
    const sent = formData.get("avatar") as File;
    expect(sent.name).toBe("foto.jpg");
  });

  it("renders the uploaded photo returned by the action", async () => {
    const action = vi.fn().mockResolvedValue({ avatarUrl: "https://sb.test/avatars/u/new.jpg" });
    render(<AvatarPicker action={action} />);

    choose(jpeg());

    expect(await screen.findByRole("img", { name: "Foto de perfil" })).toBeInTheDocument();
    expect(screen.getByText("Cambiar foto")).toBeInTheDocument();
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

  it("keeps the photo already uploaded when a later upload fails", async () => {
    const action = vi
      .fn()
      .mockResolvedValueOnce({ avatarUrl: "https://sb.test/avatars/u/new.jpg" })
      .mockResolvedValueOnce({ error: "Formato no permitido. Usá JPG, PNG, WebP o HEIC" });
    render(<AvatarPicker action={action} />);

    choose(jpeg());
    expect(await screen.findByRole("img", { name: "Foto de perfil" })).toBeInTheDocument();

    choose(jpeg("otra.jpg"));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    // The photo stays saved on the profile: removing it from the UI would lie.
    expect(screen.getByRole("img", { name: "Foto de perfil" })).toBeInTheDocument();
    expect(screen.getByText("Cambiar foto")).toBeInTheDocument();
  });

  it("blocks the file input while an upload is in flight", async () => {
    let resolve: (state: { avatarUrl: string }) => void = () => {};
    const action = vi.fn().mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    render(<AvatarPicker action={action} />);

    choose(jpeg());

    await waitFor(() => expect(fileInput()).toBeDisabled());

    resolve({ avatarUrl: "https://sb.test/avatars/u/new.jpg" });
    await waitFor(() => expect(fileInput()).not.toBeDisabled());
  });

  it("reports the upload state to the parent", async () => {
    const onUploadingChange = vi.fn();
    const action = vi.fn().mockResolvedValue({ avatarUrl: "https://sb.test/avatars/u/new.jpg" });
    render(<AvatarPicker action={action} onUploadingChange={onUploadingChange} />);

    choose(jpeg());

    await waitFor(() => expect(onUploadingChange).toHaveBeenCalledWith(true));
    await waitFor(() => expect(onUploadingChange).toHaveBeenLastCalledWith(false));
  });

  it("shows 'Subiendo...' while the upload is in flight", async () => {
    let resolve: (state: { avatarUrl: string }) => void = () => {};
    const action = vi.fn().mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    render(<AvatarPicker action={action} />);

    choose(jpeg());

    expect(await screen.findByText("Subiendo...")).toBeInTheDocument();

    resolve({ avatarUrl: "https://sb.test/avatars/u/new.jpg" });
    await waitFor(() => expect(screen.queryByText("Subiendo...")).toBeNull());
  });
});
