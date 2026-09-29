import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";
import { roleCan, CAN_MANAGE_BOOKINGS } from "@/src/lib/rbac";
import { RENTAL_BOOKING_STATUS_LABELS, RENTAL_BOOKING_STATUS_COLORS } from "@/src/lib/labels";
import { formatDate, monthLabel } from "@/src/lib/format";
import { isDateWithinBooking, formatDateOnly } from "@/src/lib/rental";
import PageHeader from "@/src/components/PageHeader";
import type { RentalBooking } from "@prisma/client";

const WEEKDAY_LABELS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default async function RentalsCalendarPage({
  searchParams,
}: {
  searchParams: { y?: string; m?: string };
}) {
  const session = await getSession();
  const canManage = session ? roleCan(session.role, CAN_MANAGE_BOOKINGS) : false;

  const now = new Date();
  const year = Number(searchParams.y) || now.getUTCFullYear();
  const month = Number(searchParams.m) || now.getUTCMonth() + 1; // 1-12

  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startOfNextMonth = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leadingBlanks = startOfMonth.getUTCDay(); // 0 (الأحد) .. 6

  const prevMonth = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const nextMonth = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };

  const monthBookings = await prisma.rentalBooking.findMany({
    where: {
      status: { not: "CANCELLED" },
      checkInDate: { lt: startOfNextMonth },
      checkOutDate: { gt: startOfMonth },
    },
    orderBy: { checkInDate: "asc" },
  });

  function bookingForDay(day: number): RentalBooking | undefined {
    const date = new Date(Date.UTC(year, month - 1, day));
    return monthBookings.find((b) => isDateWithinBooking(date, b.checkInDate, b.checkOutDate));
  }

  const todayKey = formatDateOnly(now);

  return (
    <div>
      <PageHeader
        title="حجوزات الاستراحة"
        subtitle="تقويم الأيام المحجوزة والمتاحة"
        actions={
          canManage ? (
            <Link href="/rentals/new" className="btn-primary">
              + حجز جديد
            </Link>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <Link href={`/rentals?y=${prevMonth.y}&m=${prevMonth.m}`} className="btn-secondary whitespace-nowrap text-sm">
              → السابق
            </Link>
            <h2 className="whitespace-nowrap font-semibold text-slate-700">{monthLabel(month, year)}</h2>
            <Link href={`/rentals?y=${nextMonth.y}&m=${nextMonth.m}`} className="btn-secondary whitespace-nowrap text-sm">
              التالي ←
            </Link>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
            {WEEKDAY_LABELS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const booking = bookingForDay(day);
              const dayKey = formatDateOnly(new Date(Date.UTC(year, month - 1, day)));
              const isToday = dayKey === todayKey;

              const baseClasses = "flex h-16 flex-col rounded-lg border p-1 text-xs";
              if (booking) {
                const colorClasses =
                  booking.status === "CONFIRMED"
                    ? "border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                    : "border-amber-300 bg-amber-50 hover:bg-amber-100";
                return (
                  <Link
                    key={day}
                    href={`/rentals/${booking.id}`}
                    className={`${baseClasses} ${colorClasses} ${isToday ? "ring-2 ring-brand-500" : ""}`}
                  >
                    <span className="font-semibold">{day}</span>
                    <span className="truncate text-[11px]">{booking.customerName}</span>
                  </Link>
                );
              }

              return canManage ? (
                <Link
                  key={day}
                  href={`/rentals/new?date=${dayKey}`}
                  className={`${baseClasses} border-slate-200 bg-white hover:bg-slate-50 ${
                    isToday ? "ring-2 ring-brand-500" : ""
                  }`}
                >
                  <span className="font-semibold text-slate-700">{day}</span>
                </Link>
              ) : (
                <div
                  key={day}
                  className={`${baseClasses} border-slate-200 bg-white ${isToday ? "ring-2 ring-brand-500" : ""}`}
                >
                  <span className="font-semibold text-slate-700">{day}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded border border-emerald-300 bg-emerald-50" /> مؤكد
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded border border-amber-300 bg-amber-50" /> معلّق
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded border border-slate-200 bg-white" /> متاح
            </span>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold text-slate-700">حجوزات هذا الشهر</h2>
          <ul className="space-y-2 text-sm">
            {monthBookings.map((b) => (
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
            {monthBookings.length === 0 ? (
              <li className="py-4 text-center text-slate-400">لا توجد حجوزات هذا الشهر</li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
