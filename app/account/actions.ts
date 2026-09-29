"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/src/lib/prisma";
import { requireSession, hashPassword, verifyPassword, writeAuditLog } from "@/src/lib/auth";

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
