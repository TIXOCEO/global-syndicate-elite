import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // allow login + create-character
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/create-character") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/manifest.json") ||
    pathname.startsWith("/sw.js")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  // if no token → go login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      "https://globalsyndicate.online";

    const res = await fetch(`${apiUrl}/api/state/sync`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.status === 404) {
      return NextResponse.redirect(
        new URL("/create-character", req.url)
      );
    }

  } catch (err) {
    console.error("Middleware state check failed", err);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
    Protect everything except API and static files
    */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
