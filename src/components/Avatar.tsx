"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { isServableAvatarImageUrl } from "@/lib/avatar-image-url";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
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
}: {
  name: string;
  size: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-full bg-linear-to-br from-brand-mint to-brand-blue text-on-primary flex items-center justify-center font-display font-bold",
        sizeClasses[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const servableSrc = src && isServableAvatarImageUrl(src) ? src : null;
  const [failed, setFailed] = useState(false);

  // Reset runtime failure when the caller swaps to a new URL.
  useEffect(() => {
    setFailed(false);
  }, [servableSrc]);

  if (!servableSrc || failed) {
    return <InitialsFallback name={name} size={size} className={className} />;
  }

  return (
    <Image
      src={servableSrc}
      alt={name}
      width={sizePx[size]}
      height={sizePx[size]}
      onError={() => setFailed(true)}
      className={cn("rounded-full object-cover", sizeClasses[size], className)}
    />
  );
}
