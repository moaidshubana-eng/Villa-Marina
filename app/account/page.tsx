import { redirect } from "next/navigation";
import { getSession } from "@/src/lib/auth";
import { ROLE_LABELS } from "@/src/lib/rbac";
import PageHeader from "@/src/components/PageHeader";
import ChangePasswordForm from "./ChangePasswordForm";
import ProfileForm from "./ProfileForm";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <PageHeader title="إعدادات الحساب" subtitle="بياناتك الشخصية وكلمة المرور" />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-1 font-semibold text-slate-700">بيانات الحساب</h2>
          <p className="mb-4 text-xs text-slate-500">الدور: {ROLE_LABELS[session.role]}</p>
          <ProfileForm fullName={session.fullName} email={session.email} />
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold text-slate-700">تغيير كلمة المرور</h2>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
