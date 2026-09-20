import type { NextConfig } from "next";
import {
  getSupabaseAvatarRemotePatterns,
  shouldAllowLocalIPForAvatars,
} from "./src/lib/avatar-image-url";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*"],
  reactCompiler: false,
  images: {
    // Keep in lockstep with isServableAvatarImageUrl (Avatar + AvatarPicker fallback).
    remotePatterns: getSupabaseAvatarRemotePatterns(),
    // Local Supabase serves avatars on 127.0.0.1/localhost. Next 16 blocks private
    // IPs in the image optimizer unless this is true — without it, /_next/image
    // answers 400 "url parameter is not allowed" while Storage itself is 200.
    dangerouslyAllowLocalIP: shouldAllowLocalIPForAvatars(),
  },
  experimental: {
    serverActions: {
      // El body de una server action está capado en 1 MB por default, pero el
      // avatar acepta hasta 5 MB: sin esto, cualquier foto de celular moría en el
      // framework y nunca llegaba a la validación que devuelve el error en español.
      // El margen extra cubre el overhead del multipart.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
