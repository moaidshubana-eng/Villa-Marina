import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/auth";
import { MAX_NIGHTS, parseDateOnly, isValidDateOnly, nightsBetween, formatDateOnly } from "@/src/lib/dates";
import { findConflictingBookings } from "@/src/lib/rental";

/**
 * تحقق فوري (من BookingForm أثناء اختيار التواريخ) - إرشادي فقط: الحفظ نفسه
 * يُعيد الفحص، وقيد قاعدة البيانات يمنع التعارض نهائياً.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const checkInParam = params.get("checkIn");
  const checkOutParam = params.get("checkOut");
  const excludeId = params.get("excludeId") ?? undefined;

  if (!isValidDateOnly(checkInParam) || !isValidDateOnly(checkOutParam)) {
    return NextResponse.json({ error: "تاريخ غير صحيح" }, { status: 400 });
  }

  const checkIn = parseDateOnly(checkInParam);
  const checkOut = parseDateOnly(checkOutParam);
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1 || nights > MAX_NIGHTS) {
    return NextResponse.json({ error: "مدة غير صحيحة" }, { status: 400 });
  }

  const conflicts = await findConflictingBookings(checkIn, checkOut, excludeId);

  return NextResponse.json({
    available: conflicts.length === 0,
    conflicts: conflicts.map((c) => ({
      customerName: c.customerName,
      checkInDate: formatDateOnly(c.checkInDate),
      checkOutDate: formatDateOnly(c.checkOutDate),
      status: c.status,
    })),
  });
}
