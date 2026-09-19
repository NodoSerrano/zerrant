import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  resolveGuardedActionRejection,
  TRANSPORT_ERROR,
  useGuardedActionState,
} from "@/lib/use-guarded-action-state";

type State = { error?: string } | null;

function redirectError(url = "/onboarding/step2"): Error {
  const error = new Error("NEXT_REDIRECT") as Error & { digest: string };
  error.digest = `NEXT_REDIRECT;push;${url};307;`;
  return error;
}

function notFoundError(): Error {
  const error = new Error("NEXT_HTTP_ERROR_FALLBACK") as Error & { digest: string };
  error.digest = "NEXT_HTTP_ERROR_FALLBACK;404";
  return error;
}

describe("resolveGuardedActionRejection", () => {
  it("rethrows Next redirect control-flow errors", () => {
    const err = redirectError();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(resolveGuardedActionRejection(err)).toEqual({ kind: "rethrow", error: err });
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("rethrows Next notFound / HTTP access fallback control-flow errors", () => {
    const err = notFoundError();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(resolveGuardedActionRejection(err)).toEqual({ kind: "rethrow", error: err });
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("maps unexpected rejects to the transport { error } state and logs them", () => {
    const err = new TypeError("Failed to fetch");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(resolveGuardedActionRejection(err)).toEqual({
      kind: "state",
      state: { error: TRANSPORT_ERROR },
    });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

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

  it("maps a rejected transport failure to { error }, unlocks, and does not throw", async () => {
    const action = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

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
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(TRANSPORT_ERROR);
    });

    expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
    expect(action).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
