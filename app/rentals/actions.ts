"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/src/lib/prisma";
import { requireRole, writeAuditLog } from "@/src/lib/auth";
import { CAN_MANAGE_BOOKINGS } from "@/src/lib/rbac";
import { MAX_NIGHTS, parseDateOnly, formatDateOnly, isValidDateOnly, nightsBetween } from "@/src/lib/dates";
import { findConflictingBookings, isOverlapViolation } from "@/src/lib/rental";

const dateField = (label: string) =>
  z.string().refine(isValidDateOnly, { message: `${label} غير صحيح` });

const bookingSchema = z
  .object({
    customerName: z.string().trim().min(2, "اسم العميل مطلوب").max(100, "اسم العميل طويل جداً"),
    customerPhone: z
      .string()
      .trim()
      .regex(/^\+?[0-9][0-9\s-]{6,19}$/, "رقم الهاتف غير صحيح (أرقام فقط)"),
    checkInDate: dateField("تاريخ الدخول"),
    checkOutDate: dateField("تاريخ الخروج"),
    totalAmount: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? Number(v) : null))
      .refine((v) => v === null || (Number.isFinite(v) && v >= 0 && v < 100_000_000), {
        message: "المبلغ غير صحيح",
      }),
    status: z.enum(["PENDING", "CONFIRMED"], { message: "حالة الحجز غير صحيحة" }),
    notes: z
      .string()
      .trim()
      .max(1000, "الملاحظات طويلة جداً")
      .optional()
      .transform((v) => v || null),
  })
  .superRefine((data, ctx) => {
    const nights = nightsBetween(parseDateOnly(data.checkInDate), parseDateOnly(data.checkOutDate));
    if (nights < 1) {
      ctx.addIssue({ code: "custom", path: ["checkOutDate"], message: "تاريخ الخروج يجب أن يكون بعد تاريخ الدخول" });
    } else if (nights > MAX_NIGHTS) {
      ctx.addIssue({ code: "custom", path: ["checkOutDate"], message: `مدة الحجز لا يمكن أن تتجاوز ${MAX_NIGHTS} ليلة` });
    }
  });

export type BookingFormState = { error?: string };

function parseBookingForm(formData: FormData) {
  return bookingSchema.safeParse({
    customerName: formData.get("customerName") ?? "",
    customerPhone: formData.get("customerPhone") ?? "",
    checkInDate: formData.get("checkInDate") ?? "",
    checkOutDate: formData.get("checkOutDate") ?? "",
    totalAmount: formData.get("totalAmount") ?? undefined,
    status: formData.get("status"),
    notes: formData.get("notes") ?? undefined,
  });
}

async function conflictMessage(checkIn: Date, checkOut: Date, excludeBookingId?: string) {
  const [first] = await findConflictingBookings(checkIn, checkOut, excludeBookingId);
  if (!first) return "الفترة متعارضة مع حجز آخر";
  return (
    `الفترة متعارضة مع حجز قائم لـ "${first.customerName}" ` +
    `(${formatDateOnly(first.checkInDate)} إلى ${formatDateOnly(first.checkOutDate)})`
  );
}

export async function createBookingAction(
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const session = await requireRole(...CAN_MANAGE_BOOKINGS);

  const parsed = parseBookingForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const { checkInDate: inStr, checkOutDate: outStr, ...rest } = parsed.data;
  const checkInDate = parseDateOnly(inStr);
  const checkOutDate = parseDateOnly(outStr);

  // الفحص المسبق يعطي رسالة واضحة باسم الحجز المتعارض؛ قيد قاعدة البيانات
  // (rental_bookings_no_overlap) يمنع التعارض فعلياً حتى مع طلبين متزامنين.
  if ((await findConflictingBookings(checkInDate, checkOutDate)).length > 0) {
    return { error: await conflictMessage(checkInDate, checkOutDate) };
  }

  let bookingId: string;
  try {
    const booking = await prisma.rentalBooking.create({
      data: { ...rest, checkInDate, checkOutDate, createdById: session.sub },
    });
    bookingId = booking.id;
  } catch (err) {
    if (isOverlapViolation(err)) return { error: await conflictMessage(checkInDate, checkOutDate) };
    throw err;
  }

  await writeAuditLog({
    userId: session.sub,
    action: "CREATE",
    entityType: "RentalBooking",
    entityId: bookingId,
    details: `${rest.customerName}: ${inStr} → ${outStr}`,
  });

  revalidatePath("/", "layout");
  redirect(`/rentals/${bookingId}`);
}

export async function updateBookingAction(
  bookingId: string,
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const session = await requireRole(...CAN_MANAGE_BOOKINGS);

  const existing = await prisma.rentalBooking.findUnique({ where: { id: bookingId } });
  if (!existing) return { error: "الحجز غير موجود" };
  // الإلغاء نهائي: تعديل حجز ملغى كان يُعيد تفعيله بصمت (قائمة الحالة لا تحتوي "ملغى")
  if (existing.status === "CANCELLED") return { error: "لا يمكن تعديل حجز ملغى" };

  const parsed = parseBookingForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const { checkInDate: inStr, checkOutDate: outStr, ...rest } = parsed.data;
  const checkInDate = parseDateOnly(inStr);
  const checkOutDate = parseDateOnly(outStr);

  if ((await findConflictingBookings(checkInDate, checkOutDate, bookingId)).length > 0) {
    return { error: await conflictMessage(checkInDate, checkOutDate, bookingId) };
  }

  try {
    // شرط status داخل WHERE: لو أُلغي الحجز بين القراءة والكتابة لا نُعيد تفعيله
    const { count } = await prisma.rentalBooking.updateMany({
      where: { id: bookingId, status: { not: "CANCELLED" } },
      data: { ...rest, checkInDate, checkOutDate },
    });
    if (count === 0) return { error: "لا يمكن تعديل حجز ملغى" };
  } catch (err) {
    if (isOverlapViolation(err)) return { error: await conflictMessage(checkInDate, checkOutDate, bookingId) };
    throw err;
  }

  await writeAuditLog({
    userId: session.sub,
    action: "UPDATE",
    entityType: "RentalBooking",
    entityId: bookingId,
    details: `${rest.customerName}: ${inStr} → ${outStr} (${rest.status})`,
  });

  revalidatePath("/", "layout");
  redirect(`/rentals/${bookingId}`);
}

export async function cancelBookingAction(bookingId: string): Promise<void> {
  const session = await requireRole(...CAN_MANAGE_BOOKINGS);

  const { count } = await prisma.rentalBooking.updateMany({
    where: { id: bookingId, status: { not: "CANCELLED" } },
    data: { status: "CANCELLED" },
  });

  if (count > 0) {
    await writeAuditLog({
      userId: session.sub,
      action: "STATUS_CHANGE",
      entityType: "RentalBooking",
      entityId: bookingId,
      details: "إلغاء الحجز",
    });
  }

  revalidatePath("/", "layout");
  redirect(`/rentals/${bookingId}`);
}
