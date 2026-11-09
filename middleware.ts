import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = process.env.SESSION_SECRET || "sbb-children-school-kunda-secret-key-2026-super-secure";
const key = new TextEncoder().encode(SECRET_KEY);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("sbb_erp_session")?.value;

  let session: { userId: string; role: "admin" | "teacher" } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
      session = payload as any;
    } catch {
      session = null;
    }
  }

  // Redirect logged in user from /login
  if (pathname === "/login") {
    if (session) {
      if (session.role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/teacher", request.url));
    }
    return NextResponse.next();
  }

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/teacher", request.url));
    }
    return NextResponse.next();
  }

  // Protect /teacher routes
  if (pathname.startsWith("/teacher")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Admin can also view teacher portal for testing/auditing
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/login"],
};
