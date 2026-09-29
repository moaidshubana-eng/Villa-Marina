import LoginForm from "./LoginForm";

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-800 to-brand-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="text-5xl leading-none" aria-hidden="true">
            🏡
          </span>
          <h1 className="mt-3 text-xl font-bold text-brand-800">Villa Marina</h1>
          <p className="mt-1 text-sm text-slate-500">نظام حجوزات الاستراحة</p>
        </div>
        <LoginForm next={searchParams.next} />
      </div>
    </div>
  );
}
