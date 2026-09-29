import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSession } from "@/src/lib/auth";
import Nav from "@/src/components/Nav";
import MobileNavAutoClose from "@/src/components/MobileNavAutoClose";

export const metadata: Metadata = {
  title: "Villa Marina",
  description: "نظام حجوزات استراحة Villa Marina",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="ar" dir="rtl">
      <body>
        {session ? (
          <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
            {/* فتح/إغلاق القائمة على الهاتف بدون جافاسكربت (checkbox hack) */}
            <input type="checkbox" id="nav-toggle" className="peer hidden" />

            <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
              <label
                htmlFor="nav-toggle"
                className="cursor-pointer rounded-lg px-2 py-1 text-2xl leading-none hover:bg-slate-100"
                aria-label="فتح القائمة"
              >
                ☰
              </label>
              <span className="text-xl leading-none">🏡</span>
              <span className="text-sm font-bold text-brand-800">Villa Marina</span>
            </div>

            <label
              htmlFor="nav-toggle"
              className="fixed inset-0 z-40 hidden bg-black/40 peer-checked:block md:hidden"
              aria-hidden="true"
            />

            <aside className="fixed inset-y-0 right-0 z-50 w-64 translate-x-full transition-transform duration-200 ease-out peer-checked:translate-x-0 md:sticky md:top-0 md:z-auto md:h-screen md:w-auto md:translate-x-0">
              <Nav session={session} />
            </aside>

            <main className="min-h-screen overflow-x-auto bg-slate-50 p-4 md:col-start-2 md:p-6">
              {children}
            </main>
            <MobileNavAutoClose />
          </div>
        ) : (
          <main className="min-h-screen">{children}</main>
        )}
      </body>
    </html>
  );
}
