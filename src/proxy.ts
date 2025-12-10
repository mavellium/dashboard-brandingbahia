import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicRoutes = ["/login", "/register", "/forgot"];

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  const protectedRoutes = [
    "/",
    "/dashboard",
    "/details",
    "/faq",
    "/generated",
    "/hightlight",
    "/news",
    "/setors",
  ];

  const requireAuth = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (requireAuth) {
    const token = request.cookies.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|site.webmanifest|robots.txt|images|icons|api).*)",
  ],
};