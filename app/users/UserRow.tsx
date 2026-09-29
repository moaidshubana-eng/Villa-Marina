"use client";

import { useFormState } from "react-dom";
import { useState } from "react";
import SubmitButton from "@/src/components/SubmitButton";
import { ROLE_LABELS } from "@/src/lib/rbac";
import { formatDate } from "@/src/lib/format";
import {
  setUserActiveAction,
  updateUserRoleAction,
  resetUserPasswordAction,
  type FormState,
} from "./actions";
import type { User } from "@prisma/client";
import { UserRole } from "@prisma/client";

const initialState: FormState = {};

export default function UserRow({ user, isSelf }: { user: User; isSelf: boolean }) {
  const [showReset, setShowReset] = useState(false);
  const roleAction = updateUserRoleAction.bind(null, user.id);
  const resetAction = resetUserPasswordAction.bind(null, user.id);
  const [roleState, roleFormAction] = useFormState(roleAction, initialState);
  const [resetState, resetFormAction] = useFormState(resetAction, initialState);

  return (
    <tr>
      <td>
        <div className="font-medium">{user.fullName}</div>
        <div className="text-xs text-slate-500" dir="ltr">
          {user.email}
        </div>
      </td>
      <td>
        <form action={roleFormAction} className="flex items-center gap-1">
          <select name="role" defaultValue={user.role} className="field-input py-1 text-xs">
            {Object.values(UserRole).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <SubmitButton className="btn-secondary py-1 text-xs" pendingLabel="...">
            حفظ
          </SubmitButton>
        </form>
        {roleState?.error ? <p className="text-xs text-red-600">{roleState.error}</p> : null}
      </td>
      <td>
        <span
          className={`badge ${user.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}
        >
          {user.isActive ? "نشط" : "موقوف"}
        </span>
      </td>
      <td>{formatDate(user.createdAt)}</td>
      <td className="space-y-1">
        <div className="flex flex-wrap gap-1">
          {!isSelf ? (
            <form action={setUserActiveAction.bind(null, user.id, !user.isActive)}>
              <button type="submit" className="btn-secondary py-1 text-xs">
                {user.isActive ? "إيقاف" : "تفعيل"}
              </button>
            </form>
          ) : (
            <span className="text-xs text-slate-400">(حسابك)</span>
          )}
          <button
            type="button"
            onClick={() => setShowReset((v) => !v)}
            className="btn-secondary py-1 text-xs"
          >
            إعادة تعيين كلمة المرور
          </button>
        </div>
        {showReset ? (
          <form action={resetFormAction} className="mt-1 flex items-center gap-1">
            <input
              name="newPassword"
              type="password"
              placeholder="كلمة مرور جديدة"
              minLength={8}
              required
              dir="ltr"
              className="field-input w-40 py-1 text-xs"
            />
            <SubmitButton className="btn-primary py-1 text-xs" pendingLabel="...">
              تأكيد
            </SubmitButton>
          </form>
        ) : null}
        {resetState?.error ? <p className="text-xs text-red-600">{resetState.error}</p> : null}
        {resetState?.success ? <p className="text-xs text-emerald-600">{resetState.success}</p> : null}
      </td>
    </tr>
  );
}
