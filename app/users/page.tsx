import { redirect } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";
import { roleCan, CAN_MANAGE_USERS } from "@/src/lib/rbac";
import PageHeader from "@/src/components/PageHeader";
import CreateUserForm from "./CreateUserForm";
import UserRow from "./UserRow";

export default async function UsersPage() {
  const session = await getSession();
  if (!session || !roleCan(session.role, CAN_MANAGE_USERS)) {
    redirect("/");
  }

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <PageHeader
        title="إدارة المستخدمين"
        subtitle="إضافة حسابات دخول جديدة، وتعديل الأدوار وكلمات المرور"
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>المستخدم</th>
                <th>الدور</th>
                <th>الحالة</th>
                <th>تاريخ الإنشاء</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow key={u.id} user={u} isSelf={u.id === session.sub} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold text-slate-700">إضافة مستخدم جديد</h2>
          <CreateUserForm />
        </div>
      </div>
    </div>
  );
}
