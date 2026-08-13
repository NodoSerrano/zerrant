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

      <div className="flex flex-col items-center gap-2.5">
        <h2 className="font-display text-[22px] font-bold text-text-primary">Revisá tu email</h2>
        <p className="font-body text-sm font-normal text-text-secondary leading-normal">
          {subtitle}
        </p>
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
