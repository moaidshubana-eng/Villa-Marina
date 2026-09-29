-- ضمان على مستوى قاعدة البيانات نفسها: لا يمكن وجود حجزين غير ملغيين يشتركان
-- في ليلة واحدة، حتى لو وصل طلبا حفظ في نفس اللحظة تماماً (فحص التطبيق وحده
-- "افحص ثم احفظ" لا يمنع ذلك). النطاق '[)' يطابق قاعدة التطبيق: يوم الخروج غير
-- محجوز، فحجز يبدأ يوم خروج حجز آخر مسموح. Prisma لا يمثّل قيود EXCLUDE في
-- schema.prisma، لذا يعيش هذا القيد هنا فقط.
ALTER TABLE "rental_bookings"
  ADD CONSTRAINT "rental_bookings_no_overlap"
  EXCLUDE USING gist (daterange("checkInDate", "checkOutDate", '[)') WITH &&)
  WHERE ("status" <> 'CANCELLED');

-- الخروج بعد الدخول دائماً (نطاق فارغ أو معكوس غير مقبول)
ALTER TABLE "rental_bookings"
  ADD CONSTRAINT "rental_bookings_checkout_after_checkin"
  CHECK ("checkOutDate" > "checkInDate");
