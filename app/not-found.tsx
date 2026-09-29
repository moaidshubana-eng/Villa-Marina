import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="text-4xl" aria-hidden="true">
        🔍
      </span>
      <h1 className="text-lg font-bold text-slate-800">الصفحة غير موجودة</h1>
      <p className="text-sm text-slate-500">ربما حُذف الرابط أو كُتب بشكل خاطئ.</p>
      <Link href="/" className="btn-primary">
        العودة للرئيسية
      </Link>
    </div>
  );
}
