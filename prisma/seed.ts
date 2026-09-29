/**
 * التشغيل: npm run db:seed
 *
 * وضعان:
 *  - تطوير/عرض (الافتراضي): حسابان بكلمة مرور معروفة ChangeMe123! + حجوزات تجريبية.
 *  - إنتاج (SEED_DEMO_DATA=false، يُشغَّل تلقائياً عند كل نشر عبر vercel-build):
 *    حساب المالك فقط، بكلمة المرور من ADMIN_INITIAL_PASSWORD. يُنشأ مرة واحدة
 *    فقط - النشر اللاحق لا يمسّ كلمة مروره إن غيّرها المالك من داخل النظام.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedProductionOwner() {
  const email = process.env.ADMIN_EMAIL || "admin@villamarina.ly";
  const password = process.env.ADMIN_INITIAL_PASSWORD;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`حساب المالك ${email} موجود مسبقاً - لا تغيير.`);
    return;
  }
  if (!password || password.length < 12) {
    throw new Error("ADMIN_INITIAL_PASSWORD مطلوب (12 حرفاً على الأقل) لإنشاء حساب المالك لأول مرة.");
  }

  await prisma.user.create({
    data: {
      fullName: "مالك الاستراحة",
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "ADMIN",
    },
  });
  console.log(`تم إنشاء حساب المالك ${email}.`);
}

async function main() {
  if (process.env.SEED_DEMO_DATA === "false") {
    await seedProductionOwner();
    return;
  }

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
