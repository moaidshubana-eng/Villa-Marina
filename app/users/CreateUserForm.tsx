"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/src/components/SubmitButton";
import { useResetOnSuccess } from "@/src/components/useResetOnSuccess";
import { ROLE_LABELS, USER_ROLES } from "@/src/lib/rbac";
import { createUserAction, type FormState } from "./actions";

const initialState: FormState = {};

export default function CreateUserForm() {
  const [state, formAction] = useFormState(createUserAction, initialState);
  const formRef = useResetOnSuccess(state);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div>
        <label className="field-label" htmlFor="new-user-fullName">
          الاسم الكامل
        </label>
        <input id="new-user-fullName" name="fullName" required maxLength={100} className="field-input" />
      </div>
      <div>
        <label className="field-label" htmlFor="new-user-email">
          البريد الإلكتروني
        </label>
        <input
          id="new-user-email"
          name="email"
          type="email"
          required
          dir="ltr"
          autoComplete="off"
          className="field-input"
        />
      </div>
      <div>
        <label className="field-label" htmlFor="new-user-password">
          كلمة المرور المبدئية
        </label>
        <input
          id="new-user-password"
          name="password"
          type="password"
          required
          minLength={8}
          dir="ltr"
          autoComplete="new-password"
          className="field-input"
        />
        <p className="mt-1 text-xs text-slate-400">8 أحرف على الأقل - يقدر المستخدم يغيّرها لاحقاً</p>
      </div>
      <div>
        <label className="field-label" htmlFor="new-user-role">
          الدور
        </label>
        <select id="new-user-role" name="role" defaultValue="STAFF" className="field-input">
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      {state?.error ? <p role="alert" className="alert-danger text-sm">{state.error}</p> : null}
      {state?.success ? <p className="alert-info text-sm">{state.success}</p> : null}

      <SubmitButton>إضافة المستخدم</SubmitButton>
    </form>
  );
}
