import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { safeInternalPath } from "@/lib/safe-next";
import {
  MEMBERSHIP_FLOW_COOKIE,
  MEMBERSHIP_FLOW_COOKIE_OPTIONS,
  MEMBERSHIP_FLOW_VALUE,
} from "@/features/membership/flow-cookie";

function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const requestHeadersWithPath = () => {
    const headers = new Headers(request.headers);
    headers.set("x-pathname", pathname);
    return headers;
  };

  let response = NextResponse.next({
    request: {
      headers: requestHeadersWithPath(),
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({
            request: {
              headers: requestHeadersWithPath(),
            },
          });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  return { response, supabase };
}

const PROTECTED_PREFIXES = ["/onboarding", "/profile", "/nodo", "/solicitar"];
const AUTH_PREFIXES = [
  "/auth/login",
  "/auth/signup",
  "/auth/recovery",
  "/auth/reset-password",
  "/auth/check-email",
];

// PostgREST returns this code when `.single()` finds no row; all other codes
// are real failures and are handled differently.
const NO_ROWS = "PGRST116";

/** Segment-aware match: `/nodo` must not capture `/nodocosas`. */
function underPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

const STALE_ONBOARDING_HTML = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Onboarding ya completado</title>
  </head>
  <body>
    <main>
      <h1>Ya completaste el onboarding</h1>
      <p>Esta pestaña quedó desactualizada. Tus datos de perfil se editan desde el perfil.</p>
      <p><a href="/">Ir al inicio</a></p>
    </main>
  </body>
</html>`;

export default async function proxy(request: NextRequest) {
  const { response, supabase } = updateSession(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => underPrefix(pathname, p)) || pathname === "/";
  const isAuthPage = AUTH_PREFIXES.some((p) => underPrefix(pathname, p));

  if (user && isAuthPage) {
    // Honor a safe deep-link target (ZER-136), but never another auth page:
    // that would bounce straight back here.
    const next = safeInternalPath(request.nextUrl.searchParams.get("next"));
    const target = AUTH_PREFIXES.some((p) => underPrefix(next.split(/[?#]/, 1)[0], p)) ? "/" : next;
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (!user && isProtected) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Onboarding gate (GET/nav) lives in RSC templates ((app) + (modal)) with
  // React.cache — no profiles select on every protected request (ZER-54).
  //
  // Residual ZER-61: a 307 on POST would re-POST the body to `/`. Mutations
  // from a stale /onboarding tab still need a clear HTML answer here, before RSC.
  if (
    user &&
    underPrefix(pathname, "/onboarding") &&
    request.method !== "GET" &&
    request.method !== "HEAD"
  ) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("onboarding_completado_en")
      .eq("id", user.id)
      .single();

    // Soft-allow on infra failure — same spirit as the old gate.
    if (error && error.code !== NO_ROWS) {
      console.error("[proxy] no se pudo leer onboarding_completado_en para POST stale", error);
      return response;
    }

    if (profile?.onboarding_completado_en) {
      return new NextResponse(STALE_ONBOARDING_HTML, {
        status: 409,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  }

  // Entering through the /unirme deep link marks the membership flow (ZER-136).
  // Set here because /unirme is a page, and pages cannot write cookies.
  if (pathname === "/unirme") {
    response.cookies.set(
      MEMBERSHIP_FLOW_COOKIE,
      MEMBERSHIP_FLOW_VALUE,
      MEMBERSHIP_FLOW_COOKIE_OPTIONS,
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
