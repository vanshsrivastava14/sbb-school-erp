import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { UserRole } from "@/lib/db/types";

const SECRET_KEY = process.env.SESSION_SECRET || "sbb-children-school-kunda-secret-key-2026-super-secure";
const key = new TextEncoder().encode(SECRET_KEY);

export const COOKIE_NAME = "sbb_erp_session";

export interface SessionPayload {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  expiresAt: number;
}

export async function encryptSession(payload: Omit<SessionPayload, "expiresAt">): Promise<string> {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  return new SignJWT({ ...payload, expiresAt })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decryptSession(sessionToken: string | undefined = ""): Promise<SessionPayload | null> {
  if (!sessionToken) return null;
  try {
    const { payload } = await jwtVerify(sessionToken, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSessionCookie(user: { id: string; email: string; fullName: string; role: UserRole }) {
  const token = await encryptSession({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return decryptSession(token);
}
