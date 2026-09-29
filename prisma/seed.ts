/**
 * بيانات تجريبية لنظام Villa Marina - للعرض والاختبار فقط.
 * التشغيل: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@villamarina.ly" },
    update: {},
    create: { fullName: "مالك الاستراحة", email: "admin@villamarina.ly", passwordHash, role: "ADMIN" },
  });
  await prisma.user.upsert({
    where: { email: "staff@villamarina.ly" },
    update: {},
    create: { fullName: "موظف الحجوزات", email: "staff@villamarina.ly", passwordHash, role: "STAFF" },
  });

  // على قاعدة بيانات الإنتاج: SEED_DEMO_DATA=false لإنشاء الحسابات فقط بلا حجوزات وهمية
  if (process.env.SEED_DEMO_DATA === "false") {
    console.log("تم إنشاء الحسابات فقط (بدون حجوزات تجريبية).");
    return;
  }

  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const d = (day: number) => new Date(Date.UTC(y, m - 1, day));

  const bookings = [
    {
      customerName: "أسرة الطيب النعاس",
      customerPhone: "0921000001",
      checkInDate: d(3),
      checkOutDate: d(5),
      totalAmount: 400,
      status: "CONFIRMED" as const,
      notes: "مناسبة عائلية - 15 شخصاً تقريباً",
    },
    {
      customerName: "نادي الأصدقاء الرياضي",
      customerPhone: "0921000002",
      checkInDate: d(10),
      checkOutDate: d(11),
      totalAmount: 250,
      status: "CONFIRMED" as const,
      notes: null,
    },
    {
      customerName: "محمد الصادق أبو عجيلة",
      customerPhone: "0921000003",
      checkInDate: d(18),
      checkOutDate: d(20),
      totalAmount: 500,
      status: "PENDING" as const,
      notes: "بانتظار تأكيد العربون",
    },
  ];

  for (const b of bookings) {
    const exists = await prisma.rentalBooking.findFirst({
      where: { customerPhone: b.customerPhone, checkInDate: b.checkInDate },
    });
    if (!exists) {
      await prisma.rentalBooking.create({ data: { ...b, createdById: admin.id } });
    }
  }

  console.log("اكتملت تعبئة البيانات التجريبية.");
  console.log("كلمة المرور لجميع الحسابات: ChangeMe123!");
  console.log("  admin@villamarina.ly  (مالك - كل الصلاحيات)");
  console.log("  staff@villamarina.ly  (موظف - إدارة الحجوزات)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
