import type { UserRole } from "@prisma/client";

/** قائمة الأدوار بلا استيراد قيمة من @prisma/client (كان يسحب مكتبة Prisma إلى المتصفح). */
export const USER_ROLES: readonly UserRole[] = ["ADMIN", "STAFF", "VIEWER"];

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "مالك / مدير",
  STAFF: "موظف",
  VIEWER: "اطلاع فقط",
};

export const CAN_MANAGE_BOOKINGS: UserRole[] = ["ADMIN", "STAFF"];
export const CAN_MANAGE_USERS: UserRole[] = ["ADMIN"];

export function roleCan(role: UserRole, allowed: UserRole[]): boolean {
  return allowed.includes(role);
}
