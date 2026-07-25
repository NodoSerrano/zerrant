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

export default async function proxy(request: NextRequest) {
  const { response, supabase } = updateSession(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) || pathname === "/";
  const isAuthPage = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

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
    const { data: profile } = await supabase
      .from("profiles")
      .select("nombre, apellido, fecha_nacimiento, onboarding_completado_en")
      .eq("id", user.id)
      .single();

    const onboardingDone = Boolean(profile?.onboarding_completado_en);
    const isOnboarding = pathname.startsWith("/onboarding");

    if (!onboardingDone && !isOnboarding) {
      // Si el paso 1 ya está guardado, se retoma donde quedó.
      const step1Done = Boolean(profile?.nombre && profile?.apellido && profile?.fecha_nacimiento);
      const resume = step1Done ? "/onboarding/step2" : "/onboarding/step1";
      return NextResponse.redirect(new URL(resume, request.url));
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
