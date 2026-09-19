import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";

type State = { error?: string } | null;

describe("useGuardedActionState", () => {
  it("invokes the action only once when two submits fire before the first settles", async () => {
    let release!: (value: State) => void;
    const action = vi.fn(
      (_prev: State, _formData: FormData) =>
        new Promise<State>((resolve) => {
          release = resolve;
        }),
    );

    function Probe() {
      const [state, formAction, pending] = useGuardedActionState(action, null);
      return (
        <form action={formAction}>
          <button type="submit" disabled={pending}>
            {pending ? "Working..." : "Submit"}
          </button>
          {state?.error ? <p role="alert">{state.error}</p> : null}
        </form>
      );
    }

    render(<Probe />);
    const button = screen.getByRole("button", { name: "Submit" });

    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(action).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveTextContent("Working...");

    release(null);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
    });
  });

  it("allows a retry after the previous action settles with an error", async () => {
    const action = vi.fn().mockResolvedValueOnce({ error: "falló" }).mockResolvedValueOnce(null);

    function Probe() {
      const [state, formAction, pending] = useGuardedActionState(action, null);
      return (
        <form action={formAction}>
          <button type="submit" disabled={pending}>
            Submit
          </button>
          {state?.error ? <p role="alert">{state.error}</p> : null}
        </form>
      );
    }

    render(<Probe />);
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("falló");
    });

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(action).toHaveBeenCalledTimes(2);
    });
  });
});
