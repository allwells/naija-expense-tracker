import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  // Check for better-auth session cookie
  // The actual session validation happens in server actions/components
  // Middleware only does a lightweight cookie presence check for redirects
  const sessionCookie =
    req.cookies.get("better-auth.session_token") ??
    req.cookies.get("__Secure-better-auth.session_token");

  const hasSession = !!sessionCookie?.value;

  const isAuthRoute = req.nextUrl.pathname.startsWith("/login");
  const isProtectedRoute =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/expenses") ||
    req.nextUrl.pathname.startsWith("/income") ||
    req.nextUrl.pathname.startsWith("/reports") ||
    req.nextUrl.pathname.startsWith("/settings") ||
    req.nextUrl.pathname.startsWith("/onboarding");

  if (!hasSession && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)",
  ],
};
