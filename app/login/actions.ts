"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/src/lib/prisma";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  verifyPassword,
  writeAuditLog,
} from "@/src/lib/auth";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export type LoginState = { error?: string };

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const INVALID_CREDENTIALS = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
// تجزئة ثابتة لكلمة وهمية: نقارن بها حين لا يوجد المستخدم حتى يستغرق الرد نفس
// الوقت، فلا يُستدلّ من سرعة الرد على وجود بريد مسجّل.
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.hS3Lx8TBvl6pSaV2vXd2Pq6oVEii";

/** مسار داخلي فقط: يمنع إعادة التوجيه لموقع خارجي عبر ?next=//evil.com */
function safeNextPath(raw: FormDataEntryValue | null): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return "/";
  }
  if (raw === "/login" || raw.startsWith("/logout")) return "/";
  return raw;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const { email, password } = parsed.data;

  const recentFailures = await prisma.auditLog.count({
    where: {
      entityType: "LoginAttempt",
      entityId: email,
      action: "LOGIN_FAILED",
      createdAt: { gte: new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000) },
    },
  });
  if (recentFailures >= MAX_FAILED_ATTEMPTS) {
    return { error: `محاولات دخول خاطئة كثيرة. حاول مرة أخرى بعد ${LOCKOUT_MINUTES} دقيقة.` };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !ok) {
    await writeAuditLog({
      userId: user?.id ?? null,
      action: "LOGIN_FAILED",
      entityType: "LoginAttempt",
      entityId: email,
    });
    return { error: INVALID_CREDENTIALS };
  }
  // يُكشف أن الحساب موقوف فقط لمن يعرف كلمة مروره الصحيحة
  if (!user.isActive) {
    return { error: "هذا الحساب موقوف. تواصل مع مالك الاستراحة." };
  }

  const token = await createSessionToken({
    sub: user.id,
    role: user.role,
    fullName: user.fullName,
    email: user.email,
  });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  await writeAuditLog({ userId: user.id, action: "LOGIN", entityType: "User", entityId: user.id });

  redirect(safeNextPath(formData.get("next")));
}

export async function logoutAction() {
  cookies().delete(SESSION_COOKIE);
  redirect("/login");
}
