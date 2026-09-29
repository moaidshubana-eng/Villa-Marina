"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/src/components/SubmitButton";
import { loginAction, type LoginState } from "./actions";

export default function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useFormState<LoginState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="field-label" htmlFor="email">
          البريد الإلكتروني
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          inputMode="email"
          className="field-input"
          placeholder="name@villamarina.ly"
          dir="ltr"
        />
      </div>
      <div>
        <label className="field-label" htmlFor="password">
          كلمة المرور
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="field-input"
          dir="ltr"
        />
      </div>

      {state?.error ? (
        <p role="alert" className="alert-danger text-sm">
          {state.error}
        </p>
      ) : null}

      <SubmitButton className="btn-primary w-full" pendingLabel="جارٍ الدخول...">
        تسجيل الدخول
      </SubmitButton>
    </form>
  );
}
