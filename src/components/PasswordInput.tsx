"use client";

import { type ComponentProps, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/Input";

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type" | "endAdornment">;

/** Password field that reveals its value only while the eye button is held down. */
export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  return (
    <Input
      {...props}
      type={visible ? "text" : "password"}
      endAdornment={
        <button
          type="button"
          aria-label="Mantené presionado para ver la contraseña"
          aria-pressed={visible}
          disabled={props.disabled}
          className="flex size-9 items-center justify-center rounded-full text-text-muted hover:text-text-secondary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 touch-none select-none"
          // preventDefault keeps focus (and the mobile keyboard) on the input.
          onPointerDown={(e) => {
            e.preventDefault();
            show();
          }}
          onPointerUp={hide}
          onPointerLeave={hide}
          onPointerCancel={hide}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              show();
            }
          }}
          onKeyUp={(e) => {
            if (e.key === " " || e.key === "Enter") hide();
          }}
          onBlur={hide}
          onContextMenu={(e) => e.preventDefault()}
        >
          {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      }
    />
  );
}
