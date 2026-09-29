import Link from "next/link";
import type { RentalBooking } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { requirePageSession } from "@/src/lib/auth";
import { roleCan, CAN_MANAGE_BOOKINGS } from "@/src/lib/rbac";
import { RENTAL_BOOKING_STATUS_LABELS, RENTAL_BOOKING_STATUS_COLORS } from "@/src/lib/labels";
import { formatDate, monthLabel } from "@/src/lib/format";
import { isDateWithinBooking, formatDateOnly, todayDateOnly } from "@/src/lib/dates";
import PageHeader from "@/src/components/PageHeader";

const WEEKDAYS = [
  { full: "الأحد", short: "ح" },
  { full: "الاثنين", short: "ن" },
  { full: "الثلاثاء", short: "ث" },
  { full: "الأربعاء", short: "ر" },
  { full: "الخميس", short: "خ" },
  { full: "الجمعة", short: "ج" },
  { full: "السبت", short: "س" },
];

/** شهر/سنة من الرابط، مع رفض القيم غير المنطقية (?m=13 كان يعرض "13 2026"). */
function resolveMonth(searchParams: { y?: string; m?: string }, today: Date) {
  const y = Number(searchParams.y);
  const m = Number(searchParams.m);
  const validYear = Number.isInteger(y) && y >= 2000 && y <= 2100;
  const validMonth = Number.isInteger(m) && m >= 1 && m <= 12;
  if (validYear && validMonth) return { year: y, month: m };
  return { year: today.getUTCFullYear(), month: today.getUTCMonth() + 1 };
}

export default async function RentalsCalendarPage({
  searchParams,
}: {
  searchParams: { y?: string; m?: string };
}) {
  const session = await requirePageSession();
  const canManage = roleCan(session.role, CAN_MANAGE_BOOKINGS);

  const today = todayDateOnly();
  const todayKey = formatDateOnly(today);
  const { year, month } = resolveMonth(searchParams, today);

  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startOfNextMonth = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leadingBlanks = startOfMonth.getUTCDay(); // 0 = الأحد
  const isCurrentMonth = year === today.getUTCFullYear() && month === today.getUTCMonth() + 1;

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

  function bookingForDay(date: Date): RentalBooking | undefined {
    return monthBookings.find((b) => isDateWithinBooking(date, b.checkInDate, b.checkOutDate));
  }

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

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] [&>*]:min-w-0">
        <div className="card p-3 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <Link
              href={`/rentals?y=${prevMonth.y}&m=${prevMonth.m}`}
              className="btn-secondary whitespace-nowrap px-3 text-sm"
              aria-label="الشهر السابق"
            >
              <span aria-hidden="true">→</span>
              <span className="hidden min-[400px]:inline"> السابق</span>
            </Link>
            <div className="text-center">
              <h2 className="whitespace-nowrap font-semibold text-slate-700">{monthLabel(month, year)}</h2>
              {!isCurrentMonth ? (
                <Link href="/rentals" className="text-xs text-brand-700 hover:underline">
                  العودة لهذا الشهر
                </Link>
              ) : null}
            </div>
            <Link
              href={`/rentals?y=${nextMonth.y}&m=${nextMonth.m}`}
              className="btn-secondary whitespace-nowrap px-3 text-sm"
              aria-label="الشهر التالي"
            >
              <span className="hidden min-[400px]:inline">التالي </span>
              <span aria-hidden="true">←</span>
            </Link>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
            {WEEKDAYS.map((d) => (
              <div key={d.full} className="py-1" title={d.full}>
                <span className="sm:hidden">{d.short}</span>
                <span className="hidden sm:inline">{d.full}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(Date.UTC(year, month - 1, day));
              const dayKey = formatDateOnly(date);
              const booking = bookingForDay(date);
              const isToday = dayKey === todayKey;
              const isPast = date.getTime() < today.getTime();

              const base = `flex h-14 sm:h-16 flex-col rounded-lg border p-1 text-xs ${
                isToday ? "ring-2 ring-brand-500" : ""
              }`;

              if (booking) {
                const color =
                  booking.status === "CONFIRMED"
                    ? "border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                    : "border-amber-300 bg-amber-50 hover:bg-amber-100";
                return (
                  <Link
                    key={day}
                    href={`/rentals/${booking.id}`}
                    className={`${base} ${color} ${isPast ? "opacity-60" : ""}`}
                    title={`${booking.customerName} - ${RENTAL_BOOKING_STATUS_LABELS[booking.status]}`}
                  >
                    <span className="font-semibold">{day}</span>
                    <span className="truncate text-[10px] sm:text-[11px]">{booking.customerName}</span>
                  </Link>
                );
              }

              // يوم متاح: للمخوّل رابط لحجز جديد، والأيام الماضية باهتة وغير قابلة للنقر
              if (canManage && !isPast) {
                return (
                  <Link
                    key={day}
                    href={`/rentals/new?date=${dayKey}`}
                    className={`${base} border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50`}
                    title="حجز جديد في هذا اليوم"
                  >
                    <span className="font-semibold text-slate-700">{day}</span>
                  </Link>
                );
              }
              return (
                <div
                  key={day}
                  className={`${base} border-slate-200 ${isPast ? "bg-slate-50 text-slate-400" : "bg-white"}`}
                >
                  <span className="font-semibold">{day}</span>
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
          <h2 className="mb-4 font-semibold text-slate-700">حجوزات {monthLabel(month, year)}</h2>
          <ul className="space-y-2 text-sm">
            {monthBookings.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/rentals/${b.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{b.customerName}</div>
                    <div className="text-xs text-slate-500">
                      {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                    </div>
                  </div>
                  <span className={`badge shrink-0 ${RENTAL_BOOKING_STATUS_COLORS[b.status]}`}>
                    {RENTAL_BOOKING_STATUS_LABELS[b.status]}
                  </span>
                </Link>
              </li>
            ))}
            {monthBookings.length === 0 ? (
              <li className="py-4 text-center text-slate-400">لا توجد حجوزات في هذا الشهر</li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
