import type { Prisma } from "@prisma/client";

const CURRENCY_LABEL = process.env.CURRENCY_LABEL ?? "د.ل";

type MoneyLike = number | string | Prisma.Decimal | null | undefined;

/** تنسيق مبلغ مالي بفاصلة الآلاف وعدد منازل عشرية ثابت + رمز العملة. */
export function formatMoney(value: MoneyLike): string {
  const n = value == null ? 0 : Number(value);
  const formatted = new Intl.NumberFormat("ar-LY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
  return `${formatted} ${CURRENCY_LABEL}`;
}

/** تنسيق تاريخ بصيغة يوم/شهر/سنة مناسبة للتقارير المحاسبية. */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-LY", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-LY", {
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
