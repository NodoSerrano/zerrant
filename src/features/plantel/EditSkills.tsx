"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Clock, Plus, X } from "lucide-react";
import { FormFeedback } from "@/components/FormFeedback";
import { proposeSkill, saveProfileSkills } from "./skills-actions";
import { normalizeSkillName, suggestSkills } from "./skills";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";

interface EditSkillsProps {
  initialSkills: string[];
  /** Approved catalog names. */
  catalog: string[];
  /** The member's own proposals still waiting for an admin (ZER-163). */
  pendingProposals: string[];
}

const sameName = (a: string, b: string) => a.toLocaleLowerCase() === b.toLocaleLowerCase();

export function EditSkills({ initialSkills, catalog, pendingProposals }: EditSkillsProps) {
  const [state, formAction, pending] = useGuardedActionState(saveProfileSkills, null);
  const [proposeState, proposeAction, proposing] = useGuardedActionState(proposeSkill, null);
  const [selected, setSelected] = useState<string[]>(initialSkills);
  const [query, setQuery] = useState("");

  const suggestions = suggestSkills(catalog, selected, query);
  const proposal = normalizeSkillName(query);
  const canPropose =
    proposal !== null &&
    ![...catalog, ...pendingProposals].some((name) => sameName(name, proposal));

  function add(nombre: string) {
    setSelected((prev) => (prev.some((name) => sameName(name, nombre)) ? prev : [...prev, nombre]));
  }

  function remove(nombre: string) {
    setSelected((prev) => prev.filter((name) => !sameName(name, nombre)));
  }

  return (
    <form action={formAction} className="flex flex-col gap-[18px]">
      <div className="flex items-center justify-between">
        <Link
          href="/profile"
          aria-label="Volver al perfil"
          className="flex items-center justify-center"
        >
          <ChevronLeft size={24} className="text-text-primary" />
        </Link>
        <span className="font-display text-base font-medium text-text-primary">Habilidades</span>
        <button
          type="submit"
          disabled={pending}
          className="font-display text-[15px] font-semibold text-brand-green disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Guardar"}
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-bold text-text-primary">Tus habilidades</h1>
        <p className="font-body text-sm text-text-secondary leading-normal">
          Agregá tags. Te sugerimos los que ya usa la comunidad.
        </p>
      </div>

      {selected.map((name) => (
        <input key={name} type="hidden" name="skill" value={name} />
      ))}

      <div className="flex items-center gap-2.5 h-[50px] rounded-2xl border border-border bg-surface px-4">
        <Plus size={18} className="text-text-muted shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          placeholder="Agregar habilidad..."
          aria-label="Agregar habilidad"
          maxLength={40}
          className="flex-1 bg-transparent font-body text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      {canPropose && proposal ? (
        <div className="flex flex-col gap-1.5">
          {/* React overrides `name` on a button whose formAction is a function (ZER-223). */}
          <input type="hidden" name="propuesta" value={proposal} />
          <button
            type="submit"
            formAction={proposeAction}
            disabled={proposing}
            className="inline-flex w-fit items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-[7px] font-body text-[13px] font-medium text-text-primary disabled:opacity-50"
          >
            <Plus size={13} aria-hidden />
            {`Proponer «${proposal}»`}
          </button>
          <p className="font-body text-xs text-text-muted">
            No está en el catálogo. Un admin la revisa antes de sumarla.
          </p>
        </div>
      ) : null}
      <FormFeedback error={proposeState?.error} success={proposeState?.success} />

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => remove(name)}
              aria-label={`Quitar ${name}`}
              className="inline-flex items-center gap-1.5 rounded-pill bg-brand-green/10 px-3 py-[7px] font-body text-[13px] font-medium text-on-green-tint"
            >
              {name}
              <X size={13} className="text-brand-green" aria-hidden />
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="font-display text-[15px] font-medium text-text-secondary">
          Sugerencias
        </span>
        {suggestions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => add(name)}
                aria-label={`Agregar ${name}`}
                className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-[7px] font-body text-[13px] font-medium text-text-secondary"
              >
                <Plus size={13} className="text-text-muted" aria-hidden />
                {name}
              </button>
            ))}
          </div>
        ) : (
          <p className="font-body text-sm text-text-secondary">
            No hay más habilidades para sugerir.
          </p>
        )}
      </div>

      {pendingProposals.length > 0 ? (
        <section className="flex flex-col gap-2" aria-labelledby="skills-pending">
          <h2
            id="skills-pending"
            className="font-display text-[15px] font-medium text-text-secondary"
          >
            Pendientes de aprobación
          </h2>
          <ul className="flex flex-wrap gap-2">
            {pendingProposals.map((name) => (
              <li
                key={name}
                className="inline-flex items-center gap-1.5 rounded-pill bg-surface-inset px-3 py-[7px] font-body text-[13px] text-text-secondary"
              >
                <Clock size={13} aria-hidden />
                {name}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <FormFeedback error={state?.error} />
    </form>
  );
}
