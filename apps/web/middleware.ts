import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {

  const { pathname } = req.nextUrl;

  // Public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  // No token → redirect to login
  if (!token) {

    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";

    return NextResponse.redirect(loginUrl);

  }

  return NextResponse.next();

}

export const config = {
  matcher: [
    "/dashboard",
    "/crimes",
    "/progression",
    "/resources",
    "/jail",
    "/profile",
    "/settings"
  ]
};
