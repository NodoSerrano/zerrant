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

// jsdom no deja asignar `files` directamente, así que lo definimos a mano antes
// de disparar el change, que es lo que hace el browser al elegir un archivo.
function choose(file: File) {
  const input = fileInput();
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  fireEvent.change(input);
}

describe("AvatarPicker", () => {
  it("shows the camera placeholder and 'Agregar foto' when there is no photo", () => {
    render(<AvatarPicker action={vi.fn()} />);

    expect(screen.getByText("Agregar foto")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
    expect(document.querySelector("svg")).toBeTruthy();
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
