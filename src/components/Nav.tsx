import Link from "next/link";
import type { SessionPayload } from "@/src/lib/auth";
import { ROLE_LABELS, roleCan, CAN_MANAGE_USERS, CAN_MANAGE_BOOKINGS } from "@/src/lib/rbac";
import { logoutAction } from "@/app/login/actions";
import NavLinks, { type NavItem } from "./NavLinks";

export default function Nav({ session }: { session: SessionPayload }) {
  const items: NavItem[] = [
    { href: "/", label: "الرئيسية", icon: "📊" },
    { href: "/rentals", label: "تقويم الحجوزات", icon: "📅" },
    ...(roleCan(session.role, CAN_MANAGE_BOOKINGS) ? [{ href: "/rentals/new", label: "حجز جديد", icon: "➕" }] : []),
    ...(roleCan(session.role, CAN_MANAGE_USERS) ? [{ href: "/users", label: "المستخدمون", icon: "🔑" }] : []),
  ];

  return (
    <div className="flex h-full flex-col justify-between border-l border-slate-200 bg-white">
      <div>
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-4">
          <span className="text-3xl leading-none" aria-hidden="true">
            🏡
          </span>
          <div>
            <div className="text-sm font-bold leading-tight text-brand-800">Villa Marina</div>
            <div className="text-xs text-slate-500">نظام الحجوزات</div>
          </div>
        </div>
        <NavLinks items={items} />
      </div>
      <div className="border-t border-slate-200 p-4">
        <Link href="/account" className="mb-2 block rounded-lg px-1 py-1 text-sm hover:bg-brand-50">
          <div className="truncate font-medium">{session.fullName}</div>
          <div className="text-xs text-slate-500">{ROLE_LABELS[session.role]} · ⚙️ إعدادات الحساب</div>
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="btn-secondary w-full text-xs">
            تسجيل الخروج
          </button>
        </form>
      </div>
    </div>
  );
}
