import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
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
            request,
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

const PROTECTED_PREFIXES = ["/onboarding", "/profile", "/nodo"];
const AUTH_PREFIXES = ["/auth/login", "/auth/signup", "/auth/recovery", "/auth/reset-password"];

// PostgREST devuelve este código cuando `.single()` no encuentra la fila; el resto
// de los códigos son fallos de verdad y se tratan distinto.
const NO_ROWS = "PGRST116";

/** Match por segmento: `/nodo` no puede capturar `/nodocosas`. */
function underPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export default async function proxy(request: NextRequest) {
  const { response, supabase } = updateSession(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => underPrefix(pathname, p)) || pathname === "/";
  const isAuthPage = AUTH_PREFIXES.some((p) => underPrefix(pathname, p));

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!user && isProtected) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // El onboarding es de una sola vez: no se sale de /onboarding hasta terminar el
  // paso 2, y una vez terminado no se vuelve a entrar (esos datos se editan en
  // /profile/edit).
  if (user && isProtected) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("nombre, apellido, fecha_nacimiento, onboarding_completado_en")
      .eq("id", user.id)
      .single();

    // Si la consulta falló (timeout, permisos, 5xx) no sabemos en qué estado está
    // el onboarding. Encerrar a toda la app en /onboarding sería peor que dejar
    // pasar: sólo bloqueamos cuando la respuesta es confiable.
    if (error && error.code !== NO_ROWS) {
      console.error("[proxy] no se pudo leer el perfil para el gate de onboarding", error);
      return response;
    }

    const onboardingDone = Boolean(profile?.onboarding_completado_en);
    const step1Done = Boolean(profile?.nombre && profile?.apellido && profile?.fecha_nacimiento);
    const isOnboarding = underPrefix(pathname, "/onboarding");

    if (!onboardingDone && !isOnboarding) {
      // Se retoma donde quedó.
      return NextResponse.redirect(
        new URL(step1Done ? "/onboarding/step2" : "/onboarding/step1", request.url),
      );
    }

    // El paso 2 no puede saltearse el paso 1: sus datos son los obligatorios.
    if (!onboardingDone && !step1Done && !underPrefix(pathname, "/onboarding/step1")) {
      return NextResponse.redirect(new URL("/onboarding/step1", request.url));
    }

    if (onboardingDone && isOnboarding) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
