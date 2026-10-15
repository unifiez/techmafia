import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { env } from "./env";
import { dbConnect } from "./db";
import { User, Team, type IUser, type ITeam } from "./models";

export const SESSION_COOKIE = "tm_session";
export const ADMIN_COOKIE = "tm_admin";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours

const secretKey = new TextEncoder().encode(env.jwtSecret);

/* ── passwords ───────────────────────────────────────────── */

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/* ── session tokens ──────────────────────────────────────── */

export type SessionPayload = JWTPayload & {
  sub: string;
  email: string;
  teamId?: string;
};

export async function signSession(payload: {
  userId: string;
  email: string;
  teamId?: string;
}): Promise<string> {
  return new SignJWT({
    email: payload.email,
    teamId: payload.teamId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey);
}

async function verifyToken<T extends JWTPayload>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as T;
  } catch {
    return null;
  }
}

/* ── reading the current player ──────────────────────────── */

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken<SessionPayload>(token);
}

/**
 * Returns the logged-in user document, or null.
 * Safe to call from route handlers and server components.
 */
export async function currentUser(): Promise<IUser | null> {
  const session = await readSession();
  if (!session?.sub) return null;
  try {
    await dbConnect();
    const user = await User.findById(session.sub).lean<IUser>();
    return user ?? null;
  } catch {
    return null;
  }
}

export async function currentUserWithTeam(): Promise<{
  user: IUser;
  team: ITeam | null;
} | null> {
  const user = await currentUser();
  if (!user) return null;
  let team: ITeam | null = null;
  if (user.teamId) {
    await dbConnect();
    team = await Team.findById(user.teamId).lean<ITeam>();
  }
  return { user, team };
}

/* ── organizer ───────────────────────────────────────────── */

export async function signAdmin(): Promise<string> {
  return new SignJWT({ role: "organizer" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secretKey);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const payload = await verifyToken<JWTPayload & { role?: string }>(token);
  return payload?.role === "organizer";
}

/* ── cookie option helpers ───────────────────────────────── */

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  };
}
