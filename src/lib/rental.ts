import "server-only";
import { Prisma, type RentalBooking } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * يبحث عن حجوزات فعّالة (غير ملغاة) تتعارض مع الفترة، باستثناء حجز بعينه عند
 * التعديل. يُستدعى من التحقق الفوري (API) ومن الحفظ (server actions) معاً.
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

/**
 * هل الخطأ رفضٌ من قاعدة البيانات لحجز متداخل (قيد rental_bookings_no_overlap)؟
 * القيد هو الضمان النهائي ضد طلبين متزامنين يمرّان كلاهما من فحص التطبيق.
 */
export function isOverlapViolation(err: unknown): boolean {
  return (
    (err instanceof Prisma.PrismaClientUnknownRequestError ||
      err instanceof Prisma.PrismaClientKnownRequestError) &&
    /rental_bookings_no_overlap|23P01/.test(err.message)
  );
}
