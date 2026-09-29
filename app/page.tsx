import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";
import { roleCan, CAN_MANAGE_BOOKINGS } from "@/src/lib/rbac";
import { formatDate, formatMoney, monthLabel } from "@/src/lib/format";
import { RENTAL_BOOKING_STATUS_LABELS, RENTAL_BOOKING_STATUS_COLORS } from "@/src/lib/labels";
import { nightsBetween } from "@/src/lib/rental";
import PageHeader from "@/src/components/PageHeader";

export default async function DashboardPage() {
  const session = await getSession();
  const canManage = session ? roleCan(session.role, CAN_MANAGE_BOOKINGS) : false;

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const today = new Date(Date.UTC(year, month - 1, now.getUTCDate()));
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startOfNextMonth = new Date(Date.UTC(year, month, 1));

  const [currentBooking, monthBookings, upcoming, pendingFollowUp] = await Promise.all([
    prisma.rentalBooking.findFirst({
      where: { status: { not: "CANCELLED" }, checkInDate: { lte: today }, checkOutDate: { gt: today } },
    }),
    prisma.rentalBooking.findMany({
      where: {
        status: { not: "CANCELLED" },
        checkInDate: { lt: startOfNextMonth },
        checkOutDate: { gt: startOfMonth },
      },
    }),
    prisma.rentalBooking.findMany({
      where: { status: { not: "CANCELLED" }, checkInDate: { gt: today } },
      orderBy: { checkInDate: "asc" },
      take: 5,
    }),
    prisma.rentalBooking.findMany({
      where: { status: "PENDING", checkOutDate: { gt: today } },
      orderBy: { checkInDate: "asc" },
    }),
  ]);

  // ليالي الشهر المحجوزة فقط (حجز يمتد عبر نهاية/بداية الشهر يُقصّ على حدوده)
  const bookedNights = monthBookings.reduce((sum, b) => {
    const from = b.checkInDate > startOfMonth ? b.checkInDate : startOfMonth;
    const to = b.checkOutDate < startOfNextMonth ? b.checkOutDate : startOfNextMonth;
    return sum + nightsBetween(from, to);
  }, 0);
  const daysInMonth = nightsBetween(startOfMonth, startOfNextMonth);
  const expectedRevenue = monthBookings.reduce((sum, b) => sum + Number(b.totalAmount ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="الرئيسية"
        subtitle={`نظرة عامة - ${monthLabel(month, year)}`}
        actions={
          canManage ? (
            <Link href="/rentals/new" className="btn-primary">
              + حجز جديد
            </Link>
          ) : null
        }
      />

      <div className={`card mb-6 ${currentBooking ? "border-emerald-300 bg-emerald-50" : ""}`}>
        <div className="text-xs text-slate-500">حالة الاستراحة اليوم ({formatDate(today)})</div>
        {currentBooking ? (
          <div className="mt-1">
            <span className="text-lg font-bold text-emerald-700">مشغولة</span> —{" "}
            <Link href={`/rentals/${currentBooking.id}`} className="font-medium text-brand-700 hover:underline">
              {currentBooking.customerName}
            </Link>{" "}
            <span className="text-sm text-slate-500">(خروج {formatDate(currentBooking.checkOutDate)})</span>
          </div>
        ) : (
          <div className="mt-1 text-lg font-bold text-slate-700">متاحة</div>
        )}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card">
          <div className="text-xs text-slate-500">حجوزات هذا الشهر</div>
          <div className="mt-1 text-xl font-bold">{monthBookings.length}</div>
        </div>
        <div className="card">
          <div className="text-xs text-slate-500">ليالٍ محجوزة هذا الشهر</div>
          <div className="mt-1 text-xl font-bold">
            {bookedNights} <span className="text-sm font-normal text-slate-500">من {daysInMonth}</span>
          </div>
        </div>
        <div className="card">
          <div className="text-xs text-slate-500">إيراد الشهر المتوقع</div>
          <div className="mt-1 text-xl font-bold text-emerald-600">{formatMoney(expectedRevenue)}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold text-slate-700">الحجوزات القادمة</h2>
          {upcoming.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {upcoming.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/rentals/${b.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
                  >
                    <div>
                      <div className="font-medium">{b.customerName}</div>
                      <div className="text-xs text-slate-500">
                        {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                      </div>
                    </div>
                    <span className={`badge ${RENTAL_BOOKING_STATUS_COLORS[b.status]}`}>
                      {RENTAL_BOOKING_STATUS_LABELS[b.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">لا توجد حجوزات قادمة</p>
          )}
          <Link href="/rentals" className="mt-3 inline-block text-sm text-brand-700 hover:underline">
            عرض التقويم الكامل ←
          </Link>
        </div>

        <div className="card">
          <h2 className="mb-1 font-semibold text-slate-700">حجوزات معلّقة تحتاج متابعة</h2>
          <p className="mb-3 text-xs text-slate-500">تواصل مع العميل لتأكيد الحجز أو إلغائه</p>
          {pendingFollowUp.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {pendingFollowUp.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/rentals/${b.id}`}
                    className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 hover:bg-amber-100"
                  >
                    <div>
                      <div className="font-medium">{b.customerName}</div>
                      <div className="text-xs text-slate-500">{formatDate(b.checkInDate)}</div>
                    </div>
                    <span dir="ltr" className="text-xs text-slate-600">
                      {b.customerPhone}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">لا توجد حجوزات معلّقة</p>
          )}
        </div>
      </div>
    </div>
  );
}
