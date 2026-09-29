import { redirect } from "next/navigation";
import { getSession } from "@/src/lib/auth";
import { roleCan, CAN_MANAGE_BOOKINGS } from "@/src/lib/rbac";
import PageHeader from "@/src/components/PageHeader";
import BookingForm from "../BookingForm";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const session = await getSession();
  if (!session || !roleCan(session.role, CAN_MANAGE_BOOKINGS)) {
    redirect("/rentals");
  }

  return (
    <div>
      <PageHeader title="حجز جديد" subtitle="أدخل بيانات العميل وتاريخي الدخول والخروج" />
      <div className="card max-w-lg">
        <BookingForm defaultCheckIn={searchParams.date} />
      </div>
    </div>
  );
}
