"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { requireRole, hashPassword, writeAuditLog } from "@/src/lib/auth";
import { CAN_MANAGE_USERS } from "@/src/lib/rbac";

export type FormState = { error?: string; success?: string };

const createSchema = z.object({
  fullName: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف"),
  role: z.nativeEnum(UserRole),
});

export async function createUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole(...CAN_MANAGE_USERS);

  const parsed = createSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  try {
    const user = await prisma.user.create({
      data: {
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
      },
    });
    await writeAuditLog({
      userId: session.sub,
      action: "CREATE",
      entityType: "User",
      entityId: user.id,
      details: `${user.email} / ${user.role}`,
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "البريد الإلكتروني مستخدم مسبقاً" };
    }
    throw e;
  }

  revalidatePath("/users");
  return { success: "تمت إضافة المستخدم بنجاح" };
}

export async function setUserActiveAction(targetUserId: string, isActive: boolean) {
  const session = await requireRole(...CAN_MANAGE_USERS);

  if (targetUserId === session.sub && !isActive) {
    throw new Error("لا يمكنك إيقاف حسابك الخاص");
  }

  await prisma.user.update({ where: { id: targetUserId }, data: { isActive } });

  await writeAuditLog({
    userId: session.sub,
    action: isActive ? "ACTIVATE" : "DEACTIVATE",
    entityType: "User",
    entityId: targetUserId,
  });

  revalidatePath("/users");
}

export async function updateUserRoleAction(
  targetUserId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole(...CAN_MANAGE_USERS);

  const role = formData.get("role");
  const parsed = z.nativeEnum(UserRole).safeParse(role);
  if (!parsed.success) {
    return { error: "دور غير صحيح" };
  }

  if (targetUserId === session.sub && parsed.data !== "ADMIN") {
    return { error: "لا يمكنك تغيير دورك الخاص بعيداً عن مدير النظام" };
  }

  await prisma.user.update({ where: { id: targetUserId }, data: { role: parsed.data } });

  await writeAuditLog({
    userId: session.sub,
    action: "UPDATE",
    entityType: "User",
    entityId: targetUserId,
    details: `role=${parsed.data}`,
  });

  revalidatePath("/users");
  return { success: "تم تحديث الدور" };
}

const resetSchema = z.object({
  newPassword: z.string().min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف"),
});

export async function resetUserPasswordAction(
  targetUserId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole(...CAN_MANAGE_USERS);

  const parsed = resetSchema.safeParse({ newPassword: formData.get("newPassword") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: targetUserId }, data: { passwordHash } });

  await writeAuditLog({
    userId: session.sub,
    action: "RESET_PASSWORD",
    entityType: "User",
    entityId: targetUserId,
  });

  revalidatePath("/users");
  return { success: "تم إعادة تعيين كلمة المرور" };
}
