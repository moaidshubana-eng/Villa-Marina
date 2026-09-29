/**
 * منطق التواريخ والحجوزات البحت (بلا قاعدة بيانات) - آمن للاستيراد من مكوّنات
 * المتصفح. كل تواريخ الحجز "تواريخ فقط" تُمثَّل كـ Date عند منتصف الليل UTC،
 * مطابقةً لنوع العمود @db.Date.
 */

/** أطول مدة حجز مقبولة - حماية من خطأ كتابة سنة (مثل 2027 بدل 2026) يحجز سنة كاملة. */
export const MAX_NIGHTS = 90;

/** المنطقة الزمنية للاستراحة - "اليوم" وأوقات التسجيل تُحسب بها لا بتوقيت الخادم (UTC). */
export const APP_TIME_ZONE = "Africa/Tripoli";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** نص YYYY-MM-DD (كما يرسله input type="date") → Date عند منتصف الليل UTC. */
export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

/** Date → نص YYYY-MM-DD. */
export function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** تاريخ حقيقي بصيغة YYYY-MM-DD (يرفض 2026-02-31 وأي نص آخر). */
export function isValidDateOnly(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = parseDateOnly(value);
  return !Number.isNaN(d.getTime()) && formatDateOnly(d) === value;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

/** تاريخ اليوم في ليبيا (لا في UTC): بين 00:00 و02:00 بتوقيت ليبيا يختلف اليومان. */
export function todayDateOnly(now: Date = new Date()): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parseDateOnly(ymd);
}

/** عدد الليالي بين تاريخي الدخول والخروج. */
export function nightsBetween(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY);
}

/** "ليلة واحدة" / "ليلتان" / "3 ليالٍ" / "11 ليلة" - صيغة العدد العربية الصحيحة. */
export function nightsLabel(nights: number): string {
  if (nights === 1) return "ليلة واحدة";
  if (nights === 2) return "ليلتان";
  if (nights >= 3 && nights <= 10) return `${nights} ليالٍ`;
  return `${nights} ليلة`;
}

/**
 * هل تتداخل فترتا حجز؟ checkOut هو يوم التسليم (اليوم التالي لآخر ليلة)، فهما
 * تتداخلان إذا اشتركتا في ليلة واحدة على الأقل. حجز يبدأ يوم خروج آخر لا يتداخل.
 * نفس القاعدة يفرضها قيد قاعدة البيانات rental_bookings_no_overlap.
 */
export function bookingsOverlap(aCheckIn: Date, aCheckOut: Date, bCheckIn: Date, bCheckOut: Date): boolean {
  return aCheckIn.getTime() < bCheckOut.getTime() && bCheckIn.getTime() < aCheckOut.getTime();
}

/** هل يقع يوم ضمن ليالي حجز (الدخول شامل، الخروج غير شامل)؟ */
export function isDateWithinBooking(day: Date, checkIn: Date, checkOut: Date): boolean {
  return day.getTime() >= checkIn.getTime() && day.getTime() < checkOut.getTime();
}

/** عدد ليالي حجز الواقعة داخل فترة [from, to) - لتوزيع الليالي والإيراد على الأشهر. */
export function nightsWithin(checkIn: Date, checkOut: Date, from: Date, to: Date): number {
  const start = Math.max(checkIn.getTime(), from.getTime());
  const end = Math.min(checkOut.getTime(), to.getTime());
  return Math.max(0, Math.round((end - start) / MS_PER_DAY));
}
