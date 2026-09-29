"use client";

import { useRef, useState } from "react";
import { useFormState } from "react-dom";
import type { RentalBooking } from "@prisma/client";
import SubmitButton from "@/src/components/SubmitButton";
import { createBookingAction, updateBookingAction, type BookingFormState } from "./actions";
import {
  MAX_NIGHTS,
  addDays,
  formatDateOnly,
  isValidDateOnly,
  nightsBetween,
  nightsLabel,
  parseDateOnly,
} from "@/src/lib/dates";

const initialState: BookingFormState = {};

type Availability =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available"; nights: number }
  | { kind: "conflict"; customerName: string; checkInDate: string; checkOutDate: string }
  | { kind: "invalid"; message: string };

// Prisma.Decimal ليس قابلاً للتمرير من Server إلى Client Component
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
    booking ? formatDateOnly(booking.checkInDate) : isValidDateOnly(defaultCheckIn) ? defaultCheckIn : "",
  );
  const [checkOutDate, setCheckOutDate] = useState(booking ? formatDateOnly(booking.checkOutDate) : "");
  const [availability, setAvailability] = useState<Availability>({ kind: "idle" });
  // رقم آخر طلب: عند تغيير التاريخ بسرعة قد يصل رد طلب قديم بعد الجديد فيُظهر نتيجة خاطئة
  const latestRequest = useRef(0);

  async function checkAvailability(nextIn: string, nextOut: string) {
    const requestId = ++latestRequest.current;
    if (!isValidDateOnly(nextIn) || !isValidDateOnly(nextOut)) {
      setAvailability({ kind: "idle" });
      return;
    }
    const nights = nightsBetween(parseDateOnly(nextIn), parseDateOnly(nextOut));
    if (nights < 1) {
      setAvailability({ kind: "invalid", message: "تاريخ الخروج يجب أن يكون بعد تاريخ الدخول" });
      return;
    }
    if (nights > MAX_NIGHTS) {
      setAvailability({ kind: "invalid", message: `مدة الحجز لا يمكن أن تتجاوز ${MAX_NIGHTS} ليلة` });
      return;
    }

    setAvailability({ kind: "checking" });
    try {
      const params = new URLSearchParams({ checkIn: nextIn, checkOut: nextOut });
      if (booking) params.set("excludeId", booking.id);
      const res = await fetch(`/api/rentals/availability?${params}`);
      const data = res.ok ? await res.json() : null;
      if (requestId !== latestRequest.current) return;
      if (!data) setAvailability({ kind: "idle" });
      else if (data.available) setAvailability({ kind: "available", nights });
      else setAvailability({ kind: "conflict", ...data.conflicts[0] });
    } catch {
      if (requestId === latestRequest.current) setAvailability({ kind: "idle" });
    }
  }

  const minCheckOut = isValidDateOnly(checkInDate) ? formatDateOnly(addDays(parseDateOnly(checkInDate), 1)) : undefined;
  const idPrefix = booking ? `edit-${booking.id}` : "new";
  const fieldId = (name: string) => `${idPrefix}-${name}`;

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="field-label" htmlFor={fieldId("customerName")}>
          اسم العميل
        </label>
        <input
          id={fieldId("customerName")}
          name="customerName"
          defaultValue={booking?.customerName}
          required
          maxLength={100}
          autoComplete="off"
          className="field-input"
        />
      </div>
      <div>
        <label className="field-label" htmlFor={fieldId("customerPhone")}>
          رقم الهاتف
        </label>
        <input
          id={fieldId("customerPhone")}
          name="customerPhone"
          type="tel"
          inputMode="tel"
          defaultValue={booking?.customerPhone}
          required
          dir="ltr"
          autoComplete="off"
          placeholder="09X XXX XXXX"
          className="field-input text-right"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
        <div>
          <label className="field-label" htmlFor={fieldId("checkInDate")}>
            تاريخ الدخول
          </label>
          <input
            id={fieldId("checkInDate")}
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
          <label className="field-label" htmlFor={fieldId("checkOutDate")}>
            تاريخ الخروج
          </label>
          <input
            id={fieldId("checkOutDate")}
            type="date"
            name="checkOutDate"
            value={checkOutDate}
            min={minCheckOut}
            required
            className="field-input"
            onChange={(e) => {
              setCheckOutDate(e.target.value);
              checkAvailability(checkInDate, e.target.value);
            }}
          />
        </div>
      </div>

      <div aria-live="polite">
        {availability.kind === "checking" ? <p className="text-xs text-slate-400">جارٍ التحقق من التوفر...</p> : null}
        {availability.kind === "available" ? (
          <p className="alert-info text-sm">✅ الفترة متاحة ({nightsLabel(availability.nights)})</p>
        ) : null}
        {availability.kind === "conflict" ? (
          <p className="alert-danger text-sm">
            ⚠️ تتعارض مع حجز &quot;{availability.customerName}&quot; ({availability.checkInDate} إلى{" "}
            {availability.checkOutDate})
          </p>
        ) : null}
        {availability.kind === "invalid" ? <p className="alert-danger text-sm">⚠️ {availability.message}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor={fieldId("totalAmount")}>
          المبلغ المتفق عليه (اختياري)
        </label>
        <input
          id={fieldId("totalAmount")}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          name="totalAmount"
          defaultValue={booking?.totalAmount ?? ""}
          className="field-input"
        />
      </div>

      <div>
        <label className="field-label" htmlFor={fieldId("status")}>
          حالة الحجز
        </label>
        <select
          id={fieldId("status")}
          name="status"
          defaultValue={booking?.status === "PENDING" ? "PENDING" : "CONFIRMED"}
          className="field-input"
        >
          <option value="CONFIRMED">مؤكد</option>
          <option value="PENDING">معلّق (بانتظار التأكيد)</option>
        </select>
      </div>

      <div>
        <label className="field-label" htmlFor={fieldId("notes")}>
          ملاحظات
        </label>
        <textarea
          id={fieldId("notes")}
          name="notes"
          defaultValue={booking?.notes ?? ""}
          maxLength={1000}
          className="field-input"
          rows={2}
        />
      </div>

      {state?.error ? (
        <p role="alert" className="alert-danger text-sm">
          {state.error}
        </p>
      ) : null}

      <SubmitButton className="btn-primary w-full sm:w-auto">{booking ? "حفظ التعديلات" : "تأكيد الحجز"}</SubmitButton>
    </form>
  );
}
