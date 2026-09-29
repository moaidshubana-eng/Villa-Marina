"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "جارٍ الدخول..." : "تسجيل الدخول"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState<LoginState, FormData>(loginAction, {});

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-800 to-brand-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="text-5xl leading-none">🏡</span>
          <div className="mt-3 text-xl font-bold text-brand-800">Villa Marina</div>
          <div className="mt-1 text-sm text-slate-500">نظام حجوزات الاستراحة</div>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="field-label" htmlFor="email">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="field-input"
              placeholder="name@villamarina.ly"
              dir="ltr"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="password">
              كلمة المرور
            </label>
            <input id="password" name="password" type="password" required className="field-input" dir="ltr" />
          </div>

          {state?.error ? <p className="alert-danger text-sm">{state.error}</p> : null}

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
