"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/src/components/SubmitButton";
import { updateProfileAction, type FormState } from "./actions";

const initialState: FormState = {};

export default function ProfileForm({ fullName, email }: { fullName: string; email: string }) {
  const [state, formAction] = useFormState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      <div>
        <label className="field-label">الاسم</label>
        <input name="fullName" defaultValue={fullName} required className="field-input" />
      </div>
      <div>
        <label className="field-label">البريد الإلكتروني (يُستخدم لتسجيل الدخول)</label>
        <input name="email" type="email" defaultValue={email} required dir="ltr" className="field-input" />
      </div>
      <div>
        <label className="field-label">كلمة المرور الحالية (للتأكيد)</label>
        <input
          name="currentPassword"
          type="password"
          required
          dir="ltr"
          className="field-input"
          autoComplete="current-password"
        />
      </div>

      {state?.error ? <p className="alert-danger text-sm">{state.error}</p> : null}
      {state?.success ? <p className="alert-info text-sm">{state.success}</p> : null}

      <SubmitButton>حفظ البيانات</SubmitButton>
    </form>
  );
}
