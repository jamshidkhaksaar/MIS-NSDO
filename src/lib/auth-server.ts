import { cookies } from "next/headers";
import crypto from "crypto";
import {
  createUserSessionRecord,
  deleteSessionByTokenHash,
  findSessionByTokenHash,
  purgeExpiredSessions,
  type SessionLookupResult,
} from "@/lib/dashboard-repository";

export const SESSION_COOKIE_NAME = "nsdo_session";
const SESSION_LIFETIME_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createUserSession(userId: number): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);

  await createUserSessionRecord(userId, tokenHash, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV !== "development",
    path: "/",
    expires: expiresAt,
  });
}

export async function getUserSession(): Promise<SessionLookupResult | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    await purgeExpiredSessions().catch(() => {});
    return null;
  }

  const tokenHash = hashToken(token);
  const session = await findSessionByTokenHash(tokenHash);
  if (!session) {
    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      expires: new Date(0),
      path: "/",
    });
  }
  return session;
}

export async function requireUserSession(): Promise<SessionLookupResult> {
  const session = await getUserSession();
  if (!session) {
    throw new UnauthorizedError();
  }
  return session;
}

export async function destroyUserSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    await deleteSessionByTokenHash(tokenHash).catch(() => {});
  }

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    expires: new Date(0),
    path: "/",
  });
}
