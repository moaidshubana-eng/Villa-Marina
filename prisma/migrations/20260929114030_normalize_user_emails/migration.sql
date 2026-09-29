-- الإصدار الأول من النظام كان يحفظ البريد كما كُتب ("Ahmed@Gmail.com")، بينما
-- الدخول صار يقارن بحروف صغيرة - فحساب كهذا لا يستطيع الدخول أبداً. نوحّد كل
-- البريد المخزّن إلى حروف صغيرة بلا مسافات. صفّ يتعارض توحيده مع حساب آخر
-- موجود يُترك كما هو (بدل أن يفشل النشر كله)، والدخول يبحث عنه دون حساسية للحالة.
UPDATE "users" AS u
SET "email" = lower(btrim(u."email"))
WHERE u."email" <> lower(btrim(u."email"))
  AND NOT EXISTS (
    SELECT 1 FROM "users" AS o
    WHERE o."id" <> u."id" AND lower(btrim(o."email")) = lower(btrim(u."email"))
  );
