"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/src/components/SubmitButton";
import { useResetOnSuccess } from "@/src/components/useResetOnSuccess";
import { changePasswordAction, type FormState } from "./actions";

const initialState: FormState = {};

export default function ChangePasswordForm() {
  const [state, formAction] = useFormState(changePasswordAction, initialState);
  const formRef = useResetOnSuccess(state);

  return (
    <form ref={formRef} action={formAction} className="max-w-sm space-y-4">
      <div>
        <label className="field-label" htmlFor="pw-current">
          كلمة المرور الحالية
        </label>
        <input
          id="pw-current"
          name="currentPassword"
          type="password"
          required
          dir="ltr"
          className="field-input"
          autoComplete="current-password"
        />
      </div>
      <div>
        <label className="field-label" htmlFor="pw-new">
          كلمة المرور الجديدة
        </label>
        <input
          id="pw-new"
          name="newPassword"
          type="password"
          required
          minLength={8}
          dir="ltr"
          className="field-input"
          autoComplete="new-password"
        />
        <p className="mt-1 text-xs text-slate-400">8 أحرف على الأقل</p>
      </div>
      <div>
        <label className="field-label" htmlFor="pw-confirm">
          تأكيد كلمة المرور الجديدة
        </label>
        <input
          id="pw-confirm"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          dir="ltr"
          className="field-input"
          autoComplete="new-password"
        />
      </div>

      {state?.error ? <p role="alert" className="alert-danger text-sm">{state.error}</p> : null}
      {state?.success ? <p className="alert-info text-sm">{state.success}</p> : null}

      <SubmitButton>تغيير كلمة المرور</SubmitButton>
    </form>
  );
}
