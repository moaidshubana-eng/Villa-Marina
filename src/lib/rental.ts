import { prisma } from "./prisma";
import type { RentalBooking } from "@prisma/client";

/**
 * يحوّل نصاً بصيغة YYYY-MM-DD (كما يرسله حقل input type="date") إلى تاريخ
 * UTC عند منتصف الليل بالضبط - يطابق نوع العمود @db.Date في قاعدة البيانات
 * ويتجنّب مشاكل انزياح المنطقة الزمنية عند المقارنة بين حجزين.
 */
export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

/** يحوّل تاريخاً إلى نص YYYY-MM-DD لتعبئة حقل input type="date". */
export function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** عدد الليالي بين تاريخي الدخول والخروج (خروج - دخول بالأيام). */
export function nightsBetween(checkIn: Date, checkOut: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((checkOut.getTime() - checkIn.getTime()) / msPerDay);
}

/**
 * يتحقق مما إذا كانت فترتا حجز تتداخلان، على نمط حجوزات الفنادق: checkOut
 * يمثّل اليوم التالي لآخر ليلة محجوزة (وليس يوم إشغال). فترتان تتداخلان
 * إذا وفقط إذا بدأت إحداهما قبل نهاية الأخرى والعكس - أي تشتركان في ليلة
 * واحدة على الأقل. حجز ينتهي في نفس اليوم الذي يبدأ فيه حجز آخر لا يتداخلان
 * (تسليم/استلام بنفس اليوم أمر مقبول في نظام إيجار يومي).
 */
export function bookingsOverlap(
  aCheckIn: Date,
  aCheckOut: Date,
  bCheckIn: Date,
  bCheckOut: Date,
): boolean {
  return aCheckIn.getTime() < bCheckOut.getTime() && bCheckIn.getTime() < aCheckOut.getTime();
}

/** هل يقع يوم معيّن ضمن ليالي حجز (من checkIn شاملاً حتى checkOut غير شامل)؟ */
export function isDateWithinBooking(day: Date, checkIn: Date, checkOut: Date): boolean {
  return day.getTime() >= checkIn.getTime() && day.getTime() < checkOut.getTime();
}

/**
 * يبحث عن أي حجوزات فعّالة (غير ملغاة) تتعارض مع الفترة المطلوبة، باستثناء
 * حجز بعينه عند التعديل (excludeBookingId). مصدر الحقيقة الوحيد للتحقق من
 * التعارض - يُستدعى من واجهة التحقق الفوري (API) ومن server actions الإنشاء
 * والتعديل معاً، فلا يمكن لأي مسار إدخال تجاوز نفس القاعدة.
 */
export async function findConflictingBookings(
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string,
): Promise<RentalBooking[]> {
  return prisma.rentalBooking.findMany({
    where: {
      status: { not: "CANCELLED" },
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      checkInDate: { lt: checkOut },
      checkOutDate: { gt: checkIn },
    },
    orderBy: { checkInDate: "asc" },
  });
}
