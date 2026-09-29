import "server-only";
import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { UserRole } from "@prisma/client";

export const SESSION_COOKIE = "villamarina_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET غير مُعرَّف أو قصير جداً. عرّف قيمة عشوائية طويلة في ملف .env قبل التشغيل.");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  sub: string;
  role: UserRole;
  fullName: string;
  email: string;
};

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * الجلسة الحالية، بالبيانات الحالية من قاعدة البيانات لا من الرمز: إيقاف حساب
 * أو تغيير دوره يسري فوراً بدل انتظار انتهاء صلاحية الرمز (12 ساعة).
 * cache() يجعل الاستعلام مرة واحدة لكل طلب مهما تكرّر الاستدعاء.
 */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, fullName: true, email: true, isActive: true },
  });
  if (!user || !user.isActive) return null;
  return { sub: user.id, role: user.role, fullName: user.fullName, email: user.email };
});

/**
 * للصفحات: رمز صالح التوقيع لحساب موقوف/محذوف يمرّ من middleware، فنُحوّله إلى
 * /logout الذي يمسح الكوكي (التحويل لـ /login مباشرة سيُعيده middleware إلى /).
 */
export async function requirePageSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/logout");
  return session;
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("غير مصرح: يجب تسجيل الدخول أولاً");
  }
  return session;
}

export async function requireRole(...roles: UserRole[]): Promise<SessionPayload> {
  const session = await requireSession();
  if (!roles.includes(session.role)) {
    throw new Error("غير مصرح: صلاحياتك الحالية لا تسمح بتنفيذ هذه العملية");
  }
  return session;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** فشل التدقيق لا يجب أن يُفشل العملية الأساسية نفسها. */
export async function writeAuditLog(params: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details,
      },
    });
  } catch (err) {
    console.error("فشل تسجيل سجل التدقيق:", err);
  }
}
