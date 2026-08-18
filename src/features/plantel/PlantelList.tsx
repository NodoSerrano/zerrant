"use client";

import { useMemo, useState } from "react";
import { Search, SearchX, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { availableRoles, availableSkills, filterSerranos } from "./filter";
import { MemberCard } from "./MemberCard";
import type { SerranoMember } from "./types";

type ChipId = "todos" | "disponibles" | "rol" | "skill";

export function PlantelList({ members }: { members: SerranoMember[] }) {
  const [q, setQ] = useState("");
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [rol, setRol] = useState<string | null>(null);
  const [skill, setSkill] = useState<string | null>(null);
  const [picker, setPicker] = useState<"rol" | "skill" | null>(null);

  const roles = useMemo(() => availableRoles(members), [members]);
  const skills = useMemo(() => availableSkills(members), [members]);
  const filtered = useMemo(
    () => filterSerranos(members, { q, soloDisponibles, rol, skill }),
    [members, q, soloDisponibles, rol, skill],
  );

  function clearFilters() {
    setQ("");
    setSoloDisponibles(false);
    setRol(null);
    setSkill(null);
    setPicker(null);
  }

  function chip(id: ChipId, label: string, active: boolean, onClick: () => void) {
    return (
      <button
        key={id}
        type="button"
        onClick={onClick}
        className={cn(
          "rounded-pill px-[14px] py-2 font-display text-[13px] font-medium whitespace-nowrap",
          active
            ? "bg-primary text-on-primary"
            : "bg-surface border border-border text-text-secondary",
        )}
      >
        {label}
      </button>
    );
  }

  function option(label: string, active: boolean, onClick: () => void) {
    return (
      <button
        key={label}
        type="button"
        onClick={onClick}
        className={cn(
          "rounded-pill px-[14px] py-2 font-display text-[13px] font-medium",
          active ? "bg-primary text-on-primary" : "bg-surface-inset text-text-secondary",
        )}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-[3px]">
        <h1 className="font-display text-2xl font-bold text-text-primary">Plantel</h1>
        <p className="font-body text-[13px] text-text-secondary">
          {members.length} serranos en la comunidad
        </p>
      </div>

      <div className="flex items-center gap-[10px] h-12 rounded-2xl bg-surface border border-border px-4">
        <Search size={18} className="text-text-muted shrink-0" />
        <input
          type="text"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Buscar por nombre o skill"
          aria-label="Buscar por nombre o skill"
          className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-text-primary placeholder:text-text-muted"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} aria-label="Limpiar búsqueda">
            <X size={18} className="text-text-muted" />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {chip("todos", "Todos", !rol && !skill && !soloDisponibles, () => {
          setRol(null);
          setSkill(null);
          setSoloDisponibles(false);
          setPicker(null);
        })}
        {chip("disponibles", "Disponibles", soloDisponibles, () => setSoloDisponibles((v) => !v))}
        {chip("rol", "Por rol", rol !== null, () =>
          setPicker((current) => (current === "rol" ? null : "rol")),
        )}
        {chip("skill", "Por skill", skill !== null, () =>
          setPicker((current) => (current === "skill" ? null : "skill")),
        )}
      </div>

      {picker === "rol" && (
        <div className="flex gap-2 flex-wrap rounded-2xl bg-surface border border-border p-3">
          {roles.map((role) =>
            option(role, rol === role, () => {
              setRol(role);
              setPicker(null);
            }),
          )}
        </div>
      )}

      {picker === "skill" && (
        <div className="flex gap-2 flex-wrap rounded-2xl bg-surface border border-border p-3">
          {skills.map((item) =>
            option(item, skill === item, () => {
              setSkill(item);
              setPicker(null);
            }),
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-[18px] py-10 px-5 pb-20">
          <div className="size-24 rounded-full bg-surface-inset flex items-center justify-center">
            <SearchX size={40} className="text-text-muted" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="font-display text-[20px] font-bold text-text-primary">Sin resultados</h2>
            <p className="font-body text-sm text-text-secondary text-center">
              No encontramos serranos con esos filtros. Probá con otra habilidad o limpiá la
              búsqueda.
            </p>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="h-[46px] rounded-pill bg-surface border border-border px-[22px] font-display text-[15px] font-medium text-text-primary"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
