"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, X } from "lucide-react";
import { saveProfileSkills } from "./skills-actions";
import { suggestSkills } from "./skills";

interface EditSkillsProps {
  initialSkills: string[];
  catalog: string[];
}

export function EditSkills({ initialSkills, catalog }: EditSkillsProps) {
  const [state, formAction, pending] = useActionState(saveProfileSkills, null);
  const [selected, setSelected] = useState<string[]>(initialSkills);
  const [query, setQuery] = useState("");

  const suggestions = suggestSkills(catalog, selected, query);

  function add(skill: string) {
    setSelected((prev) =>
      prev.some((value) => value.toLocaleLowerCase() === skill.toLocaleLowerCase())
        ? prev
        : [...prev, skill],
    );
  }

  function remove(skill: string) {
    setSelected((prev) =>
      prev.filter((value) => value.toLocaleLowerCase() !== skill.toLocaleLowerCase()),
    );
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

      {selected.map((skill) => (
        <input key={skill} type="hidden" name="skill" value={skill} />
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
          className="flex-1 bg-transparent font-body text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => remove(skill)}
              aria-label={`Quitar ${skill}`}
              className="inline-flex items-center gap-1.5 rounded-pill bg-brand-green/10 px-3 py-[7px] font-body text-[13px] font-medium text-brand-green"
            >
              {skill}
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
            {suggestions.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => add(skill)}
                aria-label={`Agregar ${skill}`}
                className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-[7px] font-body text-[13px] font-medium text-text-secondary"
              >
                <Plus size={13} className="text-text-muted" aria-hidden />
                {skill}
              </button>
            ))}
          </div>
        ) : (
          <p className="font-body text-sm text-text-secondary">
            No hay más habilidades para sugerir.
          </p>
        )}
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-coral bg-coral/10 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
    </form>
  );
}
