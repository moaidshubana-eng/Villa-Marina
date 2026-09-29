"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/src/lib/prisma";
import { requireRole, writeAuditLog } from "@/src/lib/auth";
import { CAN_MANAGE_BOOKINGS } from "@/src/lib/rbac";
import { parseDateOnly, findConflictingBookings, formatDateOnly } from "@/src/lib/rental";

const bookingSchema = z
  .object({
    customerName: z.string().min(2, "اسم العميل مطلوب"),
    customerPhone: z.string().min(7, "رقم الهاتف غير صحيح"),
    checkInDate: z.string().min(1, "تاريخ الدخول مطلوب"),
    checkOutDate: z.string().min(1, "تاريخ الخروج مطلوب"),
    totalAmount: z.string().optional(),
    status: z.enum(["PENDING", "CONFIRMED"]),
    notes: z.string().optional(),
  })
  .refine((data) => parseDateOnly(data.checkOutDate) > parseDateOnly(data.checkInDate), {
    message: "تاريخ الخروج يجب أن يكون بعد تاريخ الدخول",
    path: ["checkOutDate"],
  });

export type BookingFormState = { error?: string };

function parseTotalAmount(raw: string | undefined): number | null {
  if (!raw || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

async function assertNoConflict(checkIn: Date, checkOut: Date, excludeBookingId?: string) {
  const conflicts = await findConflictingBookings(checkIn, checkOut, excludeBookingId);
  if (conflicts.length > 0) {
    const first = conflicts[0];
    throw new Error(
      `الفترة متعارضة مع حجز قائم لـ "${first.customerName}" ` +
        `(${formatDateOnly(first.checkInDate)} إلى ${formatDateOnly(first.checkOutDate)})`,
    );
  }
}

export async function createBookingAction(
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const session = await requireRole(...CAN_MANAGE_BOOKINGS);

  const parsed = bookingSchema.safeParse({
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    checkInDate: formData.get("checkInDate"),
    checkOutDate: formData.get("checkOutDate"),
    totalAmount: formData.get("totalAmount") || undefined,
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const checkInDate = parseDateOnly(parsed.data.checkInDate);
  const checkOutDate = parseDateOnly(parsed.data.checkOutDate);

  try {
    await assertNoConflict(checkInDate, checkOutDate);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "تعارض في الحجز" };
  }

  const booking = await prisma.rentalBooking.create({
    data: {
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      checkInDate,
      checkOutDate,
      totalAmount: parseTotalAmount(parsed.data.totalAmount),
      status: parsed.data.status,
      notes: parsed.data.notes,
      createdById: session.sub,
    },
  });

  await writeAuditLog({
    userId: session.sub,
    action: "CREATE",
    entityType: "RentalBooking",
    entityId: booking.id,
    details: `${booking.customerName}: ${parsed.data.checkInDate} → ${parsed.data.checkOutDate}`,
  });

  revalidatePath("/rentals");
  redirect(`/rentals/${booking.id}`);
}

export async function updateBookingAction(
  bookingId: string,
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const session = await requireRole(...CAN_MANAGE_BOOKINGS);

  const parsed = bookingSchema.safeParse({
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    checkInDate: formData.get("checkInDate"),
    checkOutDate: formData.get("checkOutDate"),
    totalAmount: formData.get("totalAmount") || undefined,
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const checkInDate = parseDateOnly(parsed.data.checkInDate);
  const checkOutDate = parseDateOnly(parsed.data.checkOutDate);

  try {
    await assertNoConflict(checkInDate, checkOutDate, bookingId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "تعارض في الحجز" };
  }

  await prisma.rentalBooking.update({
    where: { id: bookingId },
    data: {
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      checkInDate,
      checkOutDate,
      totalAmount: parseTotalAmount(parsed.data.totalAmount),
      status: parsed.data.status,
      notes: parsed.data.notes,
    },
  });

  await writeAuditLog({
    userId: session.sub,
    action: "UPDATE",
    entityType: "RentalBooking",
    entityId: bookingId,
  });

  revalidatePath("/rentals");
  revalidatePath(`/rentals/${bookingId}`);
  redirect(`/rentals/${bookingId}`);
}

export async function cancelBookingAction(bookingId: string): Promise<void> {
  const session = await requireRole(...CAN_MANAGE_BOOKINGS);

  await prisma.rentalBooking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });

  await writeAuditLog({
    userId: session.sub,
    action: "STATUS_CHANGE",
    entityType: "RentalBooking",
    entityId: bookingId,
    details: "إلغاء الحجز",
  });

  revalidatePath("/rentals");
  revalidatePath(`/rentals/${bookingId}`);
  redirect(`/rentals/${bookingId}`);
}
