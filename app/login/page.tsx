import Link from "next/link";
import { getSession } from "@/src/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const session = await getSession();

  return (
    // fixed: من هو مسجّل دخوله يصل هذه الصفحة أيضاً، والتخطيط العام يعرض له القائمة الجانبية - نغطيها
    <div className="fixed inset-0 z-[60] flex overflow-y-auto bg-gradient-to-b from-brand-800 to-brand-900 px-4 py-6">
      <div className="m-auto w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="text-5xl leading-none" aria-hidden="true">
            🏡
          </span>
          <h1 className="mt-3 text-xl font-bold text-brand-800">Villa Marina</h1>
          <p className="mt-1 text-sm text-slate-500">نظام حجوزات الاستراحة</p>
        </div>

        {session ? (
          <div className="alert-info mb-5 text-sm">
            أنت داخل حالياً باسم <strong>{session.fullName}</strong>.{" "}
            <Link href="/" className="font-medium underline">
              ادخل للنظام
            </Link>
            <br />
            أو سجّل الدخول بحساب آخر أدناه (سيخرجك من هذا الحساب).
          </div>
        ) : null}

        <LoginForm next={searchParams.next} />
      </div>
    </div>
  );
}
