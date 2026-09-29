import { redirect } from "next/navigation";
import { getSession } from "@/src/lib/auth";
import { ROLE_LABELS } from "@/src/lib/rbac";
import PageHeader from "@/src/components/PageHeader";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <PageHeader title="إعدادات الحساب" subtitle="بياناتك الشخصية وكلمة المرور" />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold text-slate-700">بيانات الحساب</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">الاسم</dt>
              <dd>{session.fullName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">البريد الإلكتروني</dt>
              <dd dir="ltr" className="text-right">
                {session.email}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">الدور</dt>
              <dd>{ROLE_LABELS[session.role]}</dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold text-slate-700">تغيير كلمة المرور</h2>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
