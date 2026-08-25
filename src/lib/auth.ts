import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";

const AUTH_COOKIE = "auth_session";
const JWT_ALG = "HS256";

export type SubjectKind = "USER" | "COLABORADOR";

export interface SessionPayload {
  sub: string;
  kind: SubjectKind;
  email: string;
  name: string;
  role: UserRole;
  setoresPermitidosIds?: string[];
  iat?: number;
  exp?: number;
}

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não definida nas variáveis de ambiente.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(user: {
  id: string;
  kind: SubjectKind;
  email: string;
  name: string;
  role: UserRole;
  setoresPermitidosIds?: string[];
}) {
  const expiresInSec = 60 * 60 * 24 * 7; // 7 dias
  const now = Math.floor(Date.now() / 1000);

  const token = await new SignJWT({
    sub: user.id,
    kind: user.kind,
    email: user.email,
    name: user.name,
    role: user.role,
    setoresPermitidosIds: user.setoresPermitidosIds || [],
  })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSec)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: expiresInSec,
  });

  try {
    if (user.kind === "USER") {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }
  } catch {
    // ignora erro de atualização de ultimo login
  }

  return token;
}

export async function verifySession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getSecret());
    const p = payload as unknown as SessionPayload;
    if (!p.kind) p.kind = "USER";
    if (!p.setoresPermitidosIds) p.setoresPermitidosIds = [];
    return p;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await verifySession();
  if (!session) {
    throw new Error("Não autenticado.");
  }
  return session;
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}

export const authCookieName = AUTH_COOKIE;
