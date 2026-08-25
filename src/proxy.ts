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

// PostgREST returns this code when `.single()` finds no row; all other codes
// are real failures and are handled differently.
const NO_ROWS = "PGRST116";

/** Segment-aware match: `/nodo` must not capture `/nodocosas`. */
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

  // Onboarding is one-shot: the user stays in /onboarding until step 2 is done,
  // and once finished they never go back in (that data is edited in
  // /profile/edit).
  if (user && isProtected) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("nombre, apellido, fecha_nacimiento, onboarding_completado_en")
      .eq("id", user.id)
      .single();

    // If the query failed (timeout, permissions, 5xx) we don't know the
    // onboarding state. Locking the whole app into /onboarding would be worse
    // than letting users through: only block when the response is trustworthy.
    if (error && error.code !== NO_ROWS) {
      console.error("[proxy] no se pudo leer el perfil para el gate de onboarding", error);
      return response;
    }

    const onboardingDone = Boolean(profile?.onboarding_completado_en);
    const step1Done = Boolean(profile?.nombre && profile?.apellido && profile?.fecha_nacimiento);
    const isOnboarding = underPrefix(pathname, "/onboarding");

    if (!onboardingDone && !isOnboarding) {
      // Resume where the user left off.
      return NextResponse.redirect(
        new URL(step1Done ? "/onboarding/step2" : "/onboarding/step1", request.url),
      );
    }

    // Step 2 cannot skip step 1: step 1 holds the required data.
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
