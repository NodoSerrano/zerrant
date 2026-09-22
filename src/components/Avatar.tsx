"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { isServableAvatarImageUrl } from "@/lib/avatar-image-url";
import { cn } from "@/lib/utils";
import { BRAND_GRADIENT_CLASS } from "@/lib/brandGradients";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  /**
   * Accessible name for the image. Pass empty string when the name is already
   * adjacent visible text (e.g. birthday row link) so AT does not hear it twice.
   * Defaults to `name`. Empty string also marks initials fallback decorative.
   */
  alt?: string;
  className?: string;
}

const sizeClasses = {
  sm: "size-8 text-sm",
  md: "size-12 text-lg",
  lg: "size-20 text-xl",
};

const sizePx = {
  sm: 32,
  md: 48,
  lg: 80,
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function InitialsFallback({
  name,
  size,
  className,
  decorative,
}: {
  name: string;
  size: "sm" | "md" | "lg";
  className?: string;
  decorative?: boolean;
}) {
  return (
    <div
      aria-hidden={decorative ? true : undefined}
      className={cn(
        "rounded-full text-on-primary flex items-center justify-center font-display font-bold",
        BRAND_GRADIENT_CLASS,
        sizeClasses[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}

export function Avatar({ name, src, size = "md", alt, className }: AvatarProps) {
  const servableSrc = src && isServableAvatarImageUrl(src) ? src : null;
  const [failed, setFailed] = useState(false);
  const decorative = alt === "";
  const resolvedAlt = alt === undefined ? name : alt;
  const px = sizePx[size];

  // Reset runtime failure when the caller swaps to a new URL.
  useEffect(() => {
    setFailed(false);
  }, [servableSrc]);

  if (!servableSrc || failed) {
    return (
      <InitialsFallback name={name} size={size} className={className} decorative={decorative} />
    );
  }

  return (
    <Image
      src={servableSrc}
      alt={resolvedAlt}
      width={px}
      height={px}
      sizes={`${px}px`}
      onError={() => setFailed(true)}
      className={cn("rounded-full object-cover", sizeClasses[size], className)}
    />
  );
}
