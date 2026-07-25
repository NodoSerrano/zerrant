"use client";

import { type InputHTMLAttributes, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  const id = useId();

  return (
    <div className={cn("flex flex-col gap-[7px]", className)}>
      {label && (
        // El asterisco va afuera del <label> para no ensuciar el nombre accesible
        // del campo: quien usa lector de pantalla ya escucha "requerido" por el
        // atributo del input.
        <div className="flex items-center gap-1">
          <label htmlFor={id} className="text-[13px] font-medium text-text-secondary">
            {label}
          </label>
          {props.required && (
            <span aria-hidden="true" className="text-[13px] font-medium text-coral">
              *
            </span>
          )}
        </div>
      )}
      <input
        id={id}
        className={cn(
          "h-[50px] rounded-2xl border border-border bg-surface px-4 text-[15px] text-text-primary",
          "placeholder:text-text-muted",
          "focus:outline-hidden focus:ring-2 focus:ring-primary/40",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-coral focus:ring-coral/40",
          className,
        )}
        {...props}
      />
      {error && <p className="text-sm text-coral">{error}</p>}
    </div>
  );
}
