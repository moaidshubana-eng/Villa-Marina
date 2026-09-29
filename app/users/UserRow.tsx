"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import type { User } from "@prisma/client";
import SubmitButton from "@/src/components/SubmitButton";
import { ROLE_LABELS, USER_ROLES } from "@/src/lib/rbac";
import { setUserActiveAction, updateUserRoleAction, resetUserPasswordAction, type FormState } from "./actions";

const initialState: FormState = {};

// createdLabel يُنسَّق على الخادم: مكتبة ICU في Node تختلف عن المتصفح ("،" بين التاريخ
// والوقت) فكان تنسيقه هنا يسبب خطأ hydration (#425) ويُعيد React رسم الصفحة كاملة.
type SafeUser = Pick<User, "id" | "fullName" | "email" | "role" | "isActive"> & { createdLabel: string };

/** بطاقة مستخدم (لا صف جدول): الجدول كان يُقصّ على شاشة الهاتف والتابلت. */
export default function UserRow({ user, isSelf }: { user: SafeUser; isSelf: boolean }) {
  const [showReset, setShowReset] = useState(false);
  const [roleState, roleFormAction] = useFormState(updateUserRoleAction.bind(null, user.id), initialState);
  const [resetState, resetFormAction] = useFormState(resetUserPasswordAction.bind(null, user.id), initialState);

  return (
    <li className={`rounded-lg border p-4 ${user.isActive ? "border-slate-200" : "border-slate-200 bg-slate-50"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium">
            {user.fullName} {isSelf ? <span className="text-xs text-slate-400">(حسابك)</span> : null}
          </div>
          <div className="truncate text-xs text-slate-500" dir="ltr">
            {user.email}
          </div>
          <div className="mt-1 text-xs text-slate-400">أُضيف {user.createdLabel}</div>
        </div>
        <span className={`badge ${user.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
          {user.isActive ? "نشط" : "موقوف"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <form action={roleFormAction} className="flex items-center gap-1">
          <label className="sr-only" htmlFor={`role-${user.id}`}>
            الدور
          </label>
          <select
            id={`role-${user.id}`}
            name="role"
            defaultValue={user.role}
            disabled={isSelf}
            className="field-input w-auto py-1 text-xs"
          >
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          {!isSelf ? (
            <SubmitButton className="btn-secondary py-1 text-xs" pendingLabel="...">
              حفظ الدور
            </SubmitButton>
          ) : null}
        </form>

        {!isSelf ? (
          <form
            action={setUserActiveAction.bind(null, user.id, !user.isActive)}
            onSubmit={(e) => {
              if (user.isActive && !window.confirm(`إيقاف حساب "${user.fullName}"؟ لن يستطيع الدخول للنظام.`)) {
                e.preventDefault();
              }
            }}
          >
            <SubmitButton className="btn-secondary py-1 text-xs" pendingLabel="...">
              {user.isActive ? "إيقاف" : "تفعيل"}
            </SubmitButton>
          </form>
        ) : null}

        <button type="button" onClick={() => setShowReset((v) => !v)} className="btn-secondary py-1 text-xs">
          إعادة تعيين كلمة المرور
        </button>
      </div>

      {roleState?.error ? <p className="mt-2 text-xs text-red-600">{roleState.error}</p> : null}
      {roleState?.success ? <p className="mt-2 text-xs text-emerald-600">{roleState.success}</p> : null}

      {showReset ? (
        <form action={resetFormAction} className="mt-3 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`reset-${user.id}`}>
            كلمة المرور الجديدة
          </label>
          <input
            id={`reset-${user.id}`}
            name="newPassword"
            type="password"
            placeholder="كلمة مرور جديدة (8 أحرف+)"
            minLength={8}
            required
            dir="ltr"
            autoComplete="new-password"
            className="field-input w-56 py-1 text-xs"
          />
          <SubmitButton className="btn-primary py-1 text-xs" pendingLabel="...">
            تأكيد
          </SubmitButton>
        </form>
      ) : null}
      {resetState?.error ? <p className="mt-2 text-xs text-red-600">{resetState.error}</p> : null}
      {resetState?.success ? <p className="mt-2 text-xs text-emerald-600">{resetState.success}</p> : null}
    </li>
  );
}
