import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { authCookieName } from "@/lib/auth";

const PUBLIC_ROUTES = ["/login", "/api/login", "/api/health", "/_next", "/favicon.ico", "/logo"];
const PUBLIC_ROOT = "/";

function getSecret() {
  const secret = process.env.AUTH_SECRET ?? "fallback-secret-nao-producao";
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === PUBLIC_ROOT) {
    return NextResponse.next();
  }

  for (const route of PUBLIC_ROUTES) {
    if (pathname.startsWith(route)) {
      return NextResponse.next();
    }
  }

  const token = request.cookies.get(authCookieName)?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(authCookieName);
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
