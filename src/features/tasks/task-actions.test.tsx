import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actionState = vi.hoisted(() => ({ value: null as { error: string } | null }));

vi.mock("@/lib/use-guarded-action-state", () => ({
  useGuardedActionState: () => [actionState.value, vi.fn(), false],
}));

vi.mock("@/features/tasks/actions", () => ({
  assignTask: vi.fn(),
  markTaskDone: vi.fn(),
  releaseTask: vi.fn(),
  takeTask: vi.fn(),
  verifyTask: vi.fn(),
}));

import {
  AssignTaskForm,
  MarkDoneButton,
  ReleaseTaskButton,
  TakeTaskButton,
  VerifyTaskButton,
} from "./task-actions";

const TASK_ID = "11111111-1111-4111-8111-111111111111";

const CASES: [string, ReactElement][] = [
  ["TakeTaskButton", <TakeTaskButton key="take" taskId={TASK_ID} />],
  ["ReleaseTaskButton", <ReleaseTaskButton key="release" taskId={TASK_ID} />],
  [
    "AssignTaskForm",
    <AssignTaskForm key="assign" taskId={TASK_ID} members={[{ id: "m-1", name: "Lu" }]} />,
  ],
  ["MarkDoneButton", <MarkDoneButton key="done" taskId={TASK_ID} />],
  ["VerifyTaskButton", <VerifyTaskButton key="verify" taskId={TASK_ID} />],
];

beforeEach(() => {
  actionState.value = null;
});

describe("task actions feedback (ZER-177)", () => {
  it.each(CASES)("%s announces a server error as an alert", (_name, element) => {
    actionState.value = { error: "La tarea ya fue tomada" };
    render(element);
    expect(screen.getByRole("alert")).toHaveTextContent("La tarea ya fue tomada");
  });

  it.each(CASES)("%s shows no feedback before acting", (_name, element) => {
    render(element);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
