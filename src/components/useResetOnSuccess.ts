"use client";

import { useEffect, useRef } from "react";

/** يفرّغ النموذج بعد نجاح الحفظ - كانت كلمات المرور تبقى مكتوبة في الحقول. */
export function useResetOnSuccess(state: { success?: string } | undefined) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);
  return formRef;
}
