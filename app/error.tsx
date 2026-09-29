"use client";

import Link from "next/link";

/** بدل صفحة الخطأ الإنجليزية الافتراضية (انقطاع قاعدة البيانات مثلاً). */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="text-4xl" aria-hidden="true">
        ⚠️
      </span>
      <h1 className="text-lg font-bold text-slate-800">حدث خطأ غير متوقع</h1>
      <p className="text-sm text-slate-500">حاول مرة أخرى بعد قليل. إن تكرّر الخطأ أبلغ مالك الاستراحة.</p>
      <div className="flex gap-2">
        <button type="button" onClick={reset} className="btn-primary">
          إعادة المحاولة
        </button>
        <Link href="/" className="btn-secondary">
          العودة للرئيسية
        </Link>
      </div>
      {error.digest ? (
        <p className="text-xs text-slate-300" dir="ltr">
          ref: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
