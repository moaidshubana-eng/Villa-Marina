import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/src/lib/auth";
import poolPhoto from "@/src/assets/villa-marina-pool.jpg";
import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const session = await getSession();

  return (
    // fixed: من هو مسجّل دخوله يصل هذه الصفحة أيضاً، والتخطيط العام يعرض له القائمة الجانبية - نغطيها
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950">
      <div className="relative min-h-full lg:flex lg:items-center lg:px-16">
        {/* الهاتف: الصورة شريط علوي يُظهر المشهد كاملاً (خلفية كاملة كانت تُخفي المسبح خلف البطاقة).
            الحاسوب: الصورة تملأ الشاشة والبطاقة بجانبها. */}
        <div className="relative h-[52vh] min-h-[300px] lg:absolute lg:inset-0 lg:h-auto">
          <Image
            src={poolPhoto}
            alt="استراحة Villa Marina ليلاً: المسبح والنخيل"
            fill
            priority
            placeholder="blur"
            sizes="100vw"
            className="object-cover object-[38%_center] lg:object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950 lg:bg-gradient-to-l lg:from-slate-950/75 lg:via-slate-950/20 lg:to-slate-950/10" />
          <header className="absolute inset-x-0 top-8 text-center text-white lg:inset-x-auto lg:bottom-12 lg:left-16 lg:top-auto">
            <h1 className="text-4xl font-bold tracking-wide drop-shadow-lg sm:text-5xl">Villa Marina</h1>
            <p className="mt-2 text-sm text-white/85 drop-shadow sm:text-base">استراحة للإيجار اليومي</p>
          </header>
        </div>

        <section className="relative mx-4 -mt-10 mb-8 rounded-2xl bg-white/95 p-6 shadow-2xl backdrop-blur-md sm:mx-auto sm:max-w-sm sm:p-8 lg:m-0 lg:w-full">
          <h2 className="text-lg font-bold text-slate-800">تسجيل الدخول</h2>
          <p className="mb-5 mt-1 text-sm text-slate-500">نظام حجوزات الاستراحة</p>

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
        </section>
      </div>
    </div>
  );
}
