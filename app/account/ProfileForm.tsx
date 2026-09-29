"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import SubmitButton from "@/src/components/SubmitButton";
import { updateProfileAction, type FormState } from "./actions";

const initialState: FormState = {};

export default function ProfileForm({ fullName, email }: { fullName: string; email: string }) {
  const [state, formAction] = useFormState(updateProfileAction, initialState);
  const passwordRef = useRef<HTMLInputElement>(null);

  // بعد الحفظ نمسح كلمة المرور فقط؛ الاسم والبريد يبقيان بقيمهما الجديدة
  useEffect(() => {
    if (state?.success && passwordRef.current) passwordRef.current.value = "";
  }, [state]);

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      <div>
        <label className="field-label" htmlFor="profile-fullName">
          الاسم
        </label>
        <input id="profile-fullName" name="fullName" defaultValue={fullName} required maxLength={100} className="field-input" />
      </div>
      <div>
        <label className="field-label" htmlFor="profile-email">
          البريد الإلكتروني (يُستخدم لتسجيل الدخول)
        </label>
        <input
          id="profile-email"
          name="email"
          type="email"
          defaultValue={email}
          required
          dir="ltr"
          autoComplete="username"
          className="field-input"
        />
      </div>
      <div>
        <label className="field-label" htmlFor="profile-password">
          كلمة المرور الحالية (للتأكيد)
        </label>
        <input
          id="profile-password"
          ref={passwordRef}
          name="currentPassword"
          type="password"
          required
          dir="ltr"
          className="field-input"
          autoComplete="current-password"
        />
      </div>

      {state?.error ? <p role="alert" className="alert-danger text-sm">{state.error}</p> : null}
      {state?.success ? <p className="alert-info text-sm">{state.success}</p> : null}

      <SubmitButton>حفظ البيانات</SubmitButton>
    </form>
  );
}
