/** Shown after an admin converts an interviewed applicant (ZER-146). */
export function MemberConfirmedNotice() {
  return (
    <section
      aria-label="Membresía confirmada"
      className="rounded-[22px] bg-surface border border-border p-[18px] flex flex-col gap-2"
    >
      <h2 className="font-display text-[17px] font-bold text-text-primary">
        Ya sos miembro del Nodo
      </h2>
      <p className="font-body text-[13px] text-text-secondary leading-relaxed">
        Confirmamos tu membresía. Ya podés entrar a tareas, proyectos y el resto de la app de
        miembros.
      </p>
    </section>
  );
}
