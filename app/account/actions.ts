"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import {
  requireSession,
  hashPassword,
  verifyPassword,
  writeAuditLog,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/src/lib/auth";

export type FormState = { error?: string; success?: string };

const schema = z
  .object({
    currentPassword: z.string().min(1, "أدخل كلمة المرور الحالية"),
    newPassword: z.string().min(8, "كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف"),
    confirmPassword: z.string().min(1, "أعد كتابة كلمة المرور الجديدة"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "كلمة المرور الجديدة وتأكيدها غير متطابقين",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();

  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.sub } });

  const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!ok) {
    return { error: "كلمة المرور الحالية غير صحيحة" };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  await writeAuditLog({
    userId: user.id,
    action: "CHANGE_PASSWORD",
    entityType: "User",
    entityId: user.id,
  });

  revalidatePath("/account");
  return { success: "تم تغيير كلمة المرور بنجاح" };
}

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "الاسم مطلوب").max(100, "الاسم طويل جداً"),
  email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صحيح"),
  currentPassword: z.string().min(1, "أدخل كلمة المرور الحالية للتأكيد"),
});

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    currentPassword: formData.get("currentPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.sub } });
  if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return { error: "كلمة المرور الحالية غير صحيحة" };
  }

  const taken = await prisma.user.findFirst({
    where: { email: { equals: parsed.data.email, mode: "insensitive" }, id: { not: user.id } },
    select: { id: true },
  });
  if (taken) return { error: "هذا البريد مستخدم لحساب آخر" };

  let updated;
  try {
    updated = await prisma.user.update({
      where: { id: user.id },
      data: { fullName: parsed.data.fullName, email: parsed.data.email },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "هذا البريد مستخدم لحساب آخر" };
    }
    throw e;
  }

  await writeAuditLog({
    userId: user.id,
    action: "UPDATE_PROFILE",
    entityType: "User",
    entityId: user.id,
    details: user.email !== updated.email ? `${user.email} → ${updated.email}` : undefined,
  });

  // الاسم والبريد محفوظان داخل رمز الجلسة نفسه - نُعيد إصداره حتى تظهر القيم الجديدة فوراً
  const token = await createSessionToken({
    sub: updated.id,
    role: updated.role,
    fullName: updated.fullName,
    email: updated.email,
  });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  revalidatePath("/", "layout");
  return { success: "تم حفظ بيانات الحساب" };
}
