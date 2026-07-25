# ZER-10: Check Email Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `/auth/check-email` to match Pencil frame `Sk56P` with MailCheck icon, brand-blue theme, email in subtitle via searchParams, flow-based copy, and a SecondaryButton.

**Architecture:** Server component page receives `searchParams` (email + flow). Two redirects in `actions.ts` append `?email=...&flow=signup|recovery`. Page renders icon container, title, flow-based subtitle, SecondaryButton, and back link. TDD with Vitest + Testing Library.

**Tech Stack:** Next.js 16 (searchParams as Promise, async page), React 19, lucide-react, Tailwind v4, SecondaryButton client component.

---

### Task 1: Update redirects in actions.ts

**Files:**

- Modify: `src/features/auth/actions.ts:51`
- Modify: `src/features/auth/actions.ts:86`

- [ ] **Step 1: Update signUpWithPassword redirect**

```ts
// Line 51 - change from:
redirect("/auth/check-email");
// to:
redirect(`/auth/check-email?email=${encodeURIComponent(data.email)}&flow=signup`);
```

- [ ] **Step 2: Update sendPasswordReset redirect**

```ts
// Line 86 - change from:
redirect("/auth/check-email");
// to:
redirect(`/auth/check-email?email=${encodeURIComponent(email)}&flow=recovery`);
```

- [ ] **Step 3: Commit**

```bash
git add src/features/auth/actions.ts
git commit -m "feat: pass email and flow params to check-email redirects"
```

---

### Task 2: Write failing tests for CheckEmailPage

**Files:**

- Create: `src/features/auth/__tests__/check-email-page.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CheckEmailPage from "@/app/auth/check-email/page";

describe("CheckEmailPage", () => {
  it("renders MailCheck icon inside 100x100 circle with brand-blue styling", async () => {
    const searchParams = Promise.resolve({ email: "test@test.com", flow: "signup" as const });
    render(await CheckEmailPage({ searchParams }));

    const svg = document.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg!.parentElement?.className).toContain("size-[100px]");
    expect(svg!.parentElement?.className).toContain("rounded-full");
    expect(svg!.parentElement?.className).toContain("bg-brand-blue/10");
  });

  it("renders title 'Revisá tu email'", async () => {
    const searchParams = Promise.resolve({ email: "test@test.com", flow: "signup" as const });
    render(await CheckEmailPage({ searchParams }));

    expect(screen.getByText("Revisá tu email")).toBeInTheDocument();
  });

  it("renders signup subtitle with email when flow=signup", async () => {
    const searchParams = Promise.resolve({ email: "test@test.com", flow: "signup" as const });
    render(await CheckEmailPage({ searchParams }));

    expect(
      screen.getByText(
        /Te enviamos un enlace a test@test\.com\. Abrilo para confirmar tu cuenta y entrar\./,
      ),
    ).toBeInTheDocument();
  });

  it("renders recovery subtitle with email when flow=recovery", async () => {
    const searchParams = Promise.resolve({ email: "user@mail.com", flow: "recovery" as const });
    render(await CheckEmailPage({ searchParams }));

    expect(
      screen.getByText(
        /Te enviamos un enlace para restablecer tu contraseña a user@mail\.com\. Revisá tu bandeja de entrada y seguí las instrucciones\./,
      ),
    ).toBeInTheDocument();
  });

  it("renders SecondaryButton 'Reenviar email'", async () => {
    const searchParams = Promise.resolve({ email: "test@test.com", flow: "signup" as const });
    render(await CheckEmailPage({ searchParams }));

    expect(screen.getByRole("button", { name: "Reenviar email" })).toBeInTheDocument();
  });

  it("renders back link to /auth/login", async () => {
    const searchParams = Promise.resolve({ email: "test@test.com", flow: "signup" as const });
    render(await CheckEmailPage({ searchParams }));

    const backLink = screen.getByText("Volver al inicio de sesión");
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest("a")).toHaveAttribute("href", "/auth/login");
  });

  it("renders fallback copy when email is missing", async () => {
    const searchParams = Promise.resolve({ flow: "signup" as const } as {
      email?: string;
      flow?: string;
    });
    render(await CheckEmailPage({ searchParams }));

    expect(screen.getByText("Revisá tu email")).toBeInTheDocument();
    expect(screen.getByText(/Te enviamos un enlace a tu correo/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm vitest run src/features/auth/__tests__/check-email-page.test.tsx
```

Expected: all tests FAIL (page doesn't exist yet or doesn't match new spec).

---

### Task 3: Implement CheckEmailPage

**Files:**

- Modify: `src/app/auth/check-email/page.tsx`

- [ ] **Step 1: Write the page implementation**

```tsx
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { SecondaryButton } from "@/components/SecondaryButton";

interface CheckEmailPageProps {
  searchParams: Promise<{ email?: string; flow?: string }>;
}

export default async function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const { email, flow } = await searchParams;

  const signupSubtitle = `Te enviamos un enlace a ${email ?? "tu correo"}. Abrilo para confirmar tu cuenta y entrar.`;
  const recoverySubtitle = `Te enviamos un enlace para restablecer tu contraseña a ${email ?? "tu correo"}. Revisá tu bandeja de entrada y seguí las instrucciones.`;

  const subtitle = flow === "recovery" ? recoverySubtitle : signupSubtitle;

  return (
    <div className="px-[26px] py-6 flex flex-col justify-center gap-[22px] min-h-full text-center">
      <div className="size-[100px] rounded-full bg-brand-blue/10 flex items-center justify-center mx-auto">
        <MailCheck className="size-[42px] text-brand-blue" />
      </div>

      <div>
        <h2 className="font-display text-[22px] font-bold text-text-primary">Revisá tu email</h2>
        <p className="text-text-secondary text-sm mt-2">{subtitle}</p>
      </div>

      <SecondaryButton className="w-full" disabled>
        Reenviar email
      </SecondaryButton>

      <Link href="/auth/login" className="text-sm text-text-muted hover:underline font-medium">
        Volver al inicio de sesión
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
pnpm vitest run src/features/auth/__tests__/check-email-page.test.tsx
```

Expected: all 7 tests PASS.

---

### Task 4: Run full test suite and verify nothing broke

- [ ] **Step 1: Run all vitest tests**

```bash
pnpm test
```

Expected: all tests pass, no regressions.

- [ ] **Step 2: Commit**

```bash
git add src/features/auth/__tests__/check-email-page.test.tsx src/app/auth/check-email/page.tsx
git commit -m "feat: rewrite check-email page with MailCheck icon, flow-based copy, and resend button"
```
