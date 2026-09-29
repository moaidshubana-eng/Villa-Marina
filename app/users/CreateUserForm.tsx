"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/src/components/SubmitButton";
import { createUserAction, type FormState } from "./actions";
import { ROLE_LABELS } from "@/src/lib/rbac";
import { UserRole } from "@prisma/client";

const initialState: FormState = {};

export default function CreateUserForm() {
  const [state, formAction] = useFormState(createUserAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="field-label">الاسم الكامل</label>
        <input name="fullName" required className="field-input" />
      </div>
      <div>
        <label className="field-label">البريد الإلكتروني</label>
        <input name="email" type="email" required dir="ltr" className="field-input" />
      </div>
      <div>
        <label className="field-label">كلمة المرور المبدئية</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          dir="ltr"
          className="field-input"
        />
        <p className="mt-1 text-xs text-slate-400">8 أحرف على الأقل - يقدر المستخدم يغيّرها لاحقاً</p>
      </div>
      <div>
        <label className="field-label">الدور</label>
        <select name="role" defaultValue={UserRole.STAFF} className="field-input">
          {Object.values(UserRole).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      {state?.error ? <p className="alert-danger text-sm">{state.error}</p> : null}
      {state?.success ? <p className="alert-info text-sm">{state.success}</p> : null}

      <SubmitButton>إضافة المستخدم</SubmitButton>
    </form>
  );
}
