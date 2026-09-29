"use client";

import SubmitButton from "@/src/components/SubmitButton";
import { cancelBookingAction } from "../actions";

/** الإلغاء نهائي، وزرّه قريب من إصبع المستخدم على الهاتف - نطلب تأكيداً أولاً. */
export default function CancelBookingButton({ bookingId, customerName }: { bookingId: string; customerName: string }) {
  return (
    <form
      action={cancelBookingAction.bind(null, bookingId)}
      onSubmit={(e) => {
        if (!window.confirm(`إلغاء حجز "${customerName}" نهائياً؟\nستعود أيامه متاحة، ولا يمكن التراجع.`)) {
          e.preventDefault();
        }
      }}
    >
      <SubmitButton className="btn-danger text-xs" pendingLabel="جارٍ الإلغاء...">
        إلغاء الحجز
      </SubmitButton>
    </form>
  );
}
