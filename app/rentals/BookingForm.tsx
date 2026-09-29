"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import SubmitButton from "@/src/components/SubmitButton";
import { createBookingAction, updateBookingAction, type BookingFormState } from "./actions";
import type { RentalBooking } from "@prisma/client";
import { formatDateOnly } from "@/src/lib/rental";

const initialState: BookingFormState = {};

type AvailabilityState =
  | { checked: false }
  | { checked: true; available: true }
  | { checked: true; available: false; conflict: { customerName: string; checkInDate: string; checkOutDate: string } };

// Prisma.Decimal ليس كائناً قابلاً للتمرير من Server إلى Client Component -
// نستقبل هنا نسخة مبسّطة (totalAmount رقم عادي) بدل النوع الخام من Prisma.
export type SerializableBooking = Omit<RentalBooking, "totalAmount"> & {
  totalAmount: number | null;
};

export default function BookingForm({
  booking,
  defaultCheckIn,
}: {
  booking?: SerializableBooking;
  defaultCheckIn?: string;
}) {
  const action = booking ? updateBookingAction.bind(null, booking.id) : createBookingAction;
  const [state, formAction] = useFormState(action, initialState);

  const [checkInDate, setCheckInDate] = useState(
    booking ? formatDateOnly(booking.checkInDate) : defaultCheckIn ?? "",
  );
  const [checkOutDate, setCheckOutDate] = useState(
    booking ? formatDateOnly(booking.checkOutDate) : "",
  );
  const [availability, setAvailability] = useState<AvailabilityState>({ checked: false });
  const [checking, setChecking] = useState(false);

  async function checkAvailability(nextCheckIn: string, nextCheckOut: string) {
    if (!nextCheckIn || !nextCheckOut) {
      setAvailability({ checked: false });
      return;
    }
    setChecking(true);
    try {
      const params = new URLSearchParams({ checkIn: nextCheckIn, checkOut: nextCheckOut });
      if (booking) params.set("excludeId", booking.id);
      const res = await fetch(`/api/rentals/availability?${params.toString()}`);
      if (!res.ok) {
        setAvailability({ checked: false });
        return;
      }
      const data = await res.json();
      if (data.available) {
        setAvailability({ checked: true, available: true });
      } else {
        setAvailability({ checked: true, available: false, conflict: data.conflicts[0] });
      }
    } catch {
      setAvailability({ checked: false });
    } finally {
      setChecking(false);
    }
  }

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="field-label">اسم العميل</label>
        <input name="customerName" defaultValue={booking?.customerName} required className="field-input" />
      </div>
      <div>
        <label className="field-label">رقم الهاتف</label>
        <input
          name="customerPhone"
          defaultValue={booking?.customerPhone}
          required
          dir="ltr"
          className="field-input"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">تاريخ الدخول</label>
          <input
            type="date"
            name="checkInDate"
            value={checkInDate}
            required
            className="field-input"
            onChange={(e) => {
              setCheckInDate(e.target.value);
              checkAvailability(e.target.value, checkOutDate);
            }}
          />
        </div>
        <div>
          <label className="field-label">تاريخ الخروج</label>
          <input
            type="date"
            name="checkOutDate"
            value={checkOutDate}
            required
            className="field-input"
            onChange={(e) => {
              setCheckOutDate(e.target.value);
              checkAvailability(checkInDate, e.target.value);
            }}
          />
        </div>
      </div>

      {checking ? <p className="text-xs text-slate-400">جارٍ التحقق من التوفر...</p> : null}
      {!checking && availability.checked && availability.available ? (
        <p className="alert-info text-sm">✅ الفترة متاحة</p>
      ) : null}
      {!checking && availability.checked && !availability.available ? (
        <p className="alert-danger text-sm">
          ⚠️ تتعارض مع حجز "{availability.conflict.customerName}" ({availability.conflict.checkInDate} إلى{" "}
          {availability.conflict.checkOutDate})
        </p>
      ) : null}

      <div>
        <label className="field-label">المبلغ المتفق عليه (اختياري)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          name="totalAmount"
          defaultValue={booking?.totalAmount ? Number(booking.totalAmount) : ""}
          className="field-input"
        />
      </div>

      <div>
        <label className="field-label">حالة الحجز</label>
        <select name="status" defaultValue={booking?.status ?? "CONFIRMED"} className="field-input">
          <option value="CONFIRMED">مؤكد</option>
          <option value="PENDING">معلّق</option>
        </select>
      </div>

      <div>
        <label className="field-label">ملاحظات</label>
        <textarea name="notes" defaultValue={booking?.notes ?? ""} className="field-input" rows={2} />
      </div>

      {state?.error ? <p className="alert-danger text-sm">{state.error}</p> : null}

      <SubmitButton>{booking ? "حفظ التعديلات" : "تأكيد الحجز"}</SubmitButton>
    </form>
  );
}
