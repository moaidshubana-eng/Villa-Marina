import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/auth";
import { parseDateOnly, findConflictingBookings, formatDateOnly } from "@/src/lib/rental";

/**
 * تحقق فوري (يُستدعى من BookingForm أثناء اختيار التواريخ، قبل الإرسال) من
 * توفّر فترة معيّنة - لا يمثّل هذا وحده أي ضمان: server action الإنشاء/التعديل
 * يعيد نفس التحقق بشكل ملزم قبل الحفظ، لأن حجزاً آخر قد يُنشأ بين لحظة هذا
 * الاستعلام ولحظة الإرسال الفعلي.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const checkInParam = request.nextUrl.searchParams.get("checkIn");
  const checkOutParam = request.nextUrl.searchParams.get("checkOut");
  const excludeId = request.nextUrl.searchParams.get("excludeId") ?? undefined;

  if (!checkInParam || !checkOutParam) {
    return NextResponse.json({ error: "التاريخان مطلوبان" }, { status: 400 });
  }

  const checkIn = parseDateOnly(checkInParam);
  const checkOut = parseDateOnly(checkOutParam);

  if (checkOut.getTime() <= checkIn.getTime()) {
    return NextResponse.json({ error: "تاريخ الخروج يجب أن يكون بعد تاريخ الدخول" }, { status: 400 });
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
