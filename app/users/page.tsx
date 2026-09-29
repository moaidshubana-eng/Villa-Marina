import { redirect } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { requirePageSession } from "@/src/lib/auth";
import { roleCan, CAN_MANAGE_USERS } from "@/src/lib/rbac";
import { formatDateTime } from "@/src/lib/format";
import PageHeader from "@/src/components/PageHeader";
import CreateUserForm from "./CreateUserForm";
import UserRow from "./UserRow";

export default async function UsersPage() {
  const session = await requirePageSession();
  if (!roleCan(session.role, CAN_MANAGE_USERS)) {
    redirect("/");
  }

  // لا تُرسَل تجزئة كلمة المرور إلى المتصفح (UserRow مكوّن عميل)
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, fullName: true, email: true, role: true, isActive: true, createdAt: true },
  });

  return (
    <div>
      <PageHeader title="إدارة المستخدمين" subtitle="إضافة حسابات الموظفين، وتعديل الأدوار وكلمات المرور" />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="card">
          <ul className="space-y-3">
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={{ ...u, createdLabel: formatDateTime(u.createdAt) }}
                isSelf={u.id === session.sub}
              />
            ))}
          </ul>
        </div>

        <div className="card lg:self-start">
          <h2 className="mb-4 font-semibold text-slate-700">إضافة مستخدم جديد</h2>
          <CreateUserForm />
        </div>
      </div>
    </div>
  );
}
