import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";
import { roleCan, CAN_MANAGE_BOOKINGS } from "@/src/lib/rbac";
import { RENTAL_BOOKING_STATUS_LABELS, RENTAL_BOOKING_STATUS_COLORS } from "@/src/lib/labels";
import { formatDate, formatDateTime, formatMoney } from "@/src/lib/format";
import { nightsBetween } from "@/src/lib/rental";
import PageHeader from "@/src/components/PageHeader";
import BookingForm, { type SerializableBooking } from "../BookingForm";
import { cancelBookingAction } from "../actions";

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  const canManage = session ? roleCan(session.role, CAN_MANAGE_BOOKINGS) : false;

  const booking = await prisma.rentalBooking.findUnique({
    where: { id: params.id },
    include: { createdBy: true },
  });
  if (!booking) notFound();

  const nights = nightsBetween(booking.checkInDate, booking.checkOutDate);

  // Prisma.Decimal غير قابل للتمرير من Server إلى Client Component -
  // نحوّله لرقم عادي قبل تمرير الحجز إلى BookingForm (انظر SerializableBooking).
  const bookingForForm: SerializableBooking = {
    ...booking,
    totalAmount: booking.totalAmount ? Number(booking.totalAmount) : null,
  };

  return (
    <div>
      <PageHeader
        title={booking.customerName}
        subtitle={`${formatDate(booking.checkInDate)} → ${formatDate(booking.checkOutDate)} · ${nights} ${
          nights === 1 ? "ليلة" : "ليالٍ"
        }`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <span className={`badge ${RENTAL_BOOKING_STATUS_COLORS[booking.status]}`}>
                {RENTAL_BOOKING_STATUS_LABELS[booking.status]}
              </span>
              {canManage && booking.status !== "CANCELLED" ? (
                <form action={cancelBookingAction.bind(null, booking.id)}>
                  <button type="submit" className="btn-danger text-xs">
                    إلغاء الحجز
                  </button>
                </form>
              ) : null}
            </div>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">رقم الهاتف</dt>
                <dd dir="ltr" className="text-right">
                  {booking.customerPhone}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">المبلغ المتفق عليه</dt>
                <dd>{booking.totalAmount ? formatMoney(booking.totalAmount) : "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">ملاحظات</dt>
                <dd>{booking.notes || "—"}</dd>
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

        {canManage ? (
          <div className="card">
            <h2 className="mb-4 font-semibold text-slate-700">تعديل الحجز</h2>
            <BookingForm booking={bookingForForm} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
