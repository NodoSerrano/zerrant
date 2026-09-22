"use client";

import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { BRAND_CTA_SHADOW_CLASS, BRAND_GRADIENT_CLASS } from "@/lib/brandGradients";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-10 px-4 text-sm",
  md: "h-[54px] px-6 text-base",
  lg: "h-14 px-8 text-lg",
};

export function PrimaryButton({ className, size = "md", children, ...props }: PrimaryButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-pill font-display font-medium text-on-primary transition-all",
        BRAND_GRADIENT_CLASS,
        BRAND_CTA_SHADOW_CLASS,
        "hover:opacity-90",
        "active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
