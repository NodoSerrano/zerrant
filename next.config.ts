import type { NextConfig } from "next";

// Los avatares se sirven desde el bucket público de Supabase Storage, así que
// next/image necesita tener ese host permitido explícitamente.
function supabaseImagePattern() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    return [];
  }

  try {
    const { protocol, hostname, port } = new URL(url);
    return [
      {
        protocol: protocol.replace(":", "") as "http" | "https",
        hostname,
        port,
        pathname: "/storage/v1/object/public/avatars/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*"],
  reactCompiler: false,
  images: {
    remotePatterns: supabaseImagePattern(),
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
