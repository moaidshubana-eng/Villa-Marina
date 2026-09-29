import type { Prisma } from "@prisma/client";
import { APP_TIME_ZONE } from "./dates";

const CURRENCY_LABEL = process.env.CURRENCY_LABEL ?? "د.ل";

type MoneyLike = number | string | Prisma.Decimal | null | undefined;

/** مبلغ بفاصلة الآلاف ومنزلتين عشريتين + العملة. */
export function formatMoney(value: MoneyLike): string {
  const n = value == null ? 0 : Number(value);
  const formatted = new Intl.NumberFormat("ar-LY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
  return `${formatted} ${CURRENCY_LABEL}`;
}

/**
 * لأعمدة "تاريخ فقط" (@db.Date، مخزّنة منتصف الليل UTC): تُنسَّق بـ UTC وإلا
 * ظهرت يوماً سابقاً في منطقة زمنية سالبة.
 */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-LY", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * للطوابع الزمنية (createdAt...): بتوقيت ليبيا صراحةً - الخادم على Vercel يعمل
 * بـ UTC فكان الوقت يظهر متأخراً ساعتين، ويختلف بين الخادم والمتصفح.
 */
export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-LY", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export const MONTH_NAMES_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export function monthLabel(month: number, year: number): string {
  return `${MONTH_NAMES_AR[month - 1] ?? month} ${year}`;
}
