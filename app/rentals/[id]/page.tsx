import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { requirePageSession } from "@/src/lib/auth";
import { roleCan, CAN_MANAGE_BOOKINGS } from "@/src/lib/rbac";
import { RENTAL_BOOKING_STATUS_LABELS, RENTAL_BOOKING_STATUS_COLORS } from "@/src/lib/labels";
import { formatDate, formatDateTime, formatMoney } from "@/src/lib/format";
import { nightsBetween, nightsLabel } from "@/src/lib/dates";
import PageHeader from "@/src/components/PageHeader";
import BookingForm, { type SerializableBooking } from "../BookingForm";
import CancelBookingButton from "./CancelBookingButton";

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const session = await requirePageSession();
  const canManage = roleCan(session.role, CAN_MANAGE_BOOKINGS);

  const booking = await prisma.rentalBooking.findUnique({
    where: { id: params.id },
    include: { createdBy: { select: { fullName: true } } },
  });
  if (!booking) notFound();

  const isCancelled = booking.status === "CANCELLED";
  const nights = nightsBetween(booking.checkInDate, booking.checkOutDate);
  const calendarHref = `/rentals?y=${booking.checkInDate.getUTCFullYear()}&m=${booking.checkInDate.getUTCMonth() + 1}`;

  // Prisma.Decimal غير قابل للتمرير إلى Client Component - نحوّله لرقم عادي
  const { createdBy: _createdBy, ...bookingFields } = booking;
  const bookingForForm: SerializableBooking = {
    ...bookingFields,
    totalAmount: booking.totalAmount != null ? Number(booking.totalAmount) : null,
  };

  return (
    <div>
      <Link href={calendarHref} className="mb-3 inline-block text-sm text-brand-700 hover:underline">
        → العودة للتقويم
      </Link>
      <PageHeader
        title={booking.customerName}
        subtitle={`${formatDate(booking.checkInDate)} → ${formatDate(booking.checkOutDate)} · ${nightsLabel(nights)}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card">
            <div className="mb-4 flex items-center justify-between gap-2">
              <span className={`badge ${RENTAL_BOOKING_STATUS_COLORS[booking.status]}`}>
                {RENTAL_BOOKING_STATUS_LABELS[booking.status]}
              </span>
              {canManage && !isCancelled ? (
                <CancelBookingButton bookingId={booking.id} customerName={booking.customerName} />
              ) : null}
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">رقم الهاتف</dt>
                <dd>
                  <a href={`tel:${booking.customerPhone.replace(/[\s-]/g, "")}`} dir="ltr" className="text-brand-700 hover:underline">
                    {booking.customerPhone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">المبلغ المتفق عليه</dt>
                <dd>{booking.totalAmount != null ? formatMoney(booking.totalAmount) : "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">ملاحظات</dt>
                <dd className="whitespace-pre-line">{booking.notes || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">تاريخ التسجيل</dt>
                <dd>
                  {formatDateTime(booking.createdAt)}
                  {booking.createdBy ? ` · ${booking.createdBy.fullName}` : ""}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {canManage && !isCancelled ? (
          <div className="card">
            <h2 className="mb-4 font-semibold text-slate-700">تعديل الحجز</h2>
            <BookingForm booking={bookingForForm} />
          </div>
        ) : null}
        {isCancelled ? (
          <div className="alert-warning text-sm lg:self-start">
            هذا الحجز ملغى ولا يمكن تعديله. أيامه متاحة لحجز جديد.
          </div>
        ) : null}
      </div>
    </div>
  );
}
