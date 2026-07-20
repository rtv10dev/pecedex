import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const ADMIN_COOKIE = "pecedex_admin";
const SESSION_DAYS = 14;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function sessionExpiry(): Date {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

/** Solo llamar desde Server Actions / Route Handlers. */
export async function createAdminSession(): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = sessionExpiry();

  await prisma.adminSession.create({
    data: {
      token: hashToken(token),
      expiresAt,
    },
  });

  await prisma.adminSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getAdminSession(): Promise<{ id: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { token: hashToken(token) },
    select: { id: true, expiresAt: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.adminSession
      .delete({ where: { id: session.id } })
      .catch(() => {});
    return null;
  }

  return { id: session.id };
}

/** Solo llamar desde Server Actions / Route Handlers. */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;

  if (token) {
    await prisma.adminSession
      .deleteMany({ where: { token: hashToken(token) } })
      .catch(() => {});
  }

  cookieStore.delete(ADMIN_COOKIE);
}

export async function requireAdminSession(): Promise<{ id: string }> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/entrar");
  }
  return session;
}
