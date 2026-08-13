# ZER-10: Check Email Screen Design

## Overview

Rewrite the `/auth/check-email` page to match Pencil frame `Sk56P` (1.2 · Revisa tu email) with correct icons, branding tokens, copy, and a resend button.

The page serves two flows: **signup confirmation** and **password recovery confirmation**, distinguished by a `flow` query parameter.

## Route

`/auth/check-email?email=<email>&flow=<signup|recovery>`

## Component Design

Server component — no `"use client"`, no forms, no state.
Renders static content driven by `searchParams`.

**Layout**: Centered vertically (`min-h-full justify-center`), matching login/signup pattern with `px-[26px] py-6 flex flex-col justify-center gap-[22px] min-h-full text-center`.

### Common Elements

| Element          | Spec                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Icon             | `<MailCheck>` from lucide-react, 42x42, `text-brand-blue`                                 |
| Circle container | 100x100, `bg-brand-blue/10 rounded-full`, `mx-auto`                                       |
| Title            | "Revisa tu email", 22px bold, `font-display text-text-primary`                            |
| Subtitle         | Dynamic based on flow (see below), `text-text-secondary text-sm`                          |
| Resend button    | `<SecondaryButton>` with text "Reenviar email", UI only (no action)                       |
| Back link        | `<Link href="/auth/login">`, text "Volver al inicio de sesion", `text-text-muted text-sm` |

### Copy by Flow

| Flow       | Subtitle                                                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `signup`   | Te enviamos un enlace a **{email}**. Abrilo para confirmar tu cuenta y entrar.                                              |
| `recovery` | Te enviamos un enlace para restablecer tu contrasena a **{email}**. Revisa tu bandeja de entrada y segui las instrucciones. |

## Changes to `src/features/auth/actions.ts`

- `signUpWithPassword`: update redirect from `redirect("/auth/check-email")` to `redirect(\`/auth/check-email?email=${encodeURIComponent(data.email)}&flow=signup\`)`
- `sendPasswordReset`: update redirect from `redirect("/auth/check-email")` to `redirect(\`/auth/check-email?email=${encodeURIComponent(email)}&flow=recovery\`)`

## Files to Create/Modify

| File                                                    | Action                         |
| ------------------------------------------------------- | ------------------------------ |
| `src/app/auth/check-email/page.tsx`                     | Rewrite                        |
| `src/features/auth/__tests__/check-email-page.test.tsx` | New — test file                |
| `src/features/auth/actions.ts`                          | Modify — update both redirects |

## Testing

TDD per project convention. Tests cover:

1. Renders MailCheck icon inside 100x100 circle with brand-blue styling
2. Renders correct title "Revisa tu email"
3. Renders signup subtitle with email when `flow=signup`
4. Renders recovery subtitle with email when `flow=recovery`
5. Renders SecondaryButton "Reenviar email" (no action test)
6. Renders back link to `/auth/login` with correct text
7. Generic subtitle when email is missing from searchParams
