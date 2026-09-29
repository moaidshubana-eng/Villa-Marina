"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; icon: string };

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/rentals") return pathname === "/rentals" || /^\/rentals\/(?!new)/.test(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** روابط القائمة مع تمييز الصفحة الحالية (يحتاج usePathname، لذا مكوّن عميل). */
export default function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
              active ? "bg-brand-50 font-semibold text-brand-800" : "text-slate-700 hover:bg-brand-50 hover:text-brand-800"
            }`}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
