import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { authCookieName } from "@/lib/auth";

const PUBLIC_ROUTES = ["/login", "/api/login", "/api/health", "/api/session", "/_next", "/favicon.ico", "/logo"];
const PUBLIC_ROOT = "/";

const LOGIN_PAGES = ["/", "/login"];

function getSecret() {
  const secret = process.env.AUTH_SECRET ?? "fallback-secret-nao-producao";
  return new TextEncoder().encode(secret);
}

async function getValidSession(request: NextRequest) {
  const token = request.cookies.get(authCookieName)?.value;
  if (!token) return null;
  try {
    const verified = await jwtVerify(token, getSecret());
    return verified.payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (LOGIN_PAGES.includes(pathname)) {
    const session = await getValidSession(request);
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
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
