import { describe, it, expect } from "vitest";
import {
  bookingsOverlap,
  isDateWithinBooking,
  parseDateOnly,
  formatDateOnly,
  nightsBetween,
  isValidDateOnly,
  todayDateOnly,
  nightsWithin,
  nightsLabel,
} from "./dates";

const d = (s: string) => parseDateOnly(s);

describe("bookingsOverlap", () => {
  it("لا يعتبر حجزين منفصلين تماماً متعارضين", () => {
    expect(bookingsOverlap(d("2026-09-01"), d("2026-09-03"), d("2026-09-05"), d("2026-09-07"))).toBe(false);
  });

  it("لا يعتبر حجزاً ينتهي في يوم يبدأ فيه آخر متعارضاً (تسليم/استلام نفس اليوم)", () => {
    expect(bookingsOverlap(d("2026-09-01"), d("2026-09-05"), d("2026-09-05"), d("2026-09-08"))).toBe(false);
  });

  it("يعتبر تداخلاً جزئياً متعارضاً", () => {
    expect(bookingsOverlap(d("2026-09-01"), d("2026-09-05"), d("2026-09-04"), d("2026-09-08"))).toBe(true);
  });

  it("يعتبر احتواء حجز داخل آخر متعارضاً", () => {
    expect(bookingsOverlap(d("2026-09-01"), d("2026-09-10"), d("2026-09-03"), d("2026-09-05"))).toBe(true);
  });

  it("يعتبر نفس الفترة بالضبط متعارضة", () => {
    expect(bookingsOverlap(d("2026-09-10"), d("2026-09-12"), d("2026-09-10"), d("2026-09-12"))).toBe(true);
  });

  it("التعارض متماثل الاتجاه (a,b) == (b,a)", () => {
    const a = [d("2026-09-01"), d("2026-09-05")] as const;
    const b = [d("2026-09-04"), d("2026-09-08")] as const;
    expect(bookingsOverlap(...a, ...b)).toBe(bookingsOverlap(...b, ...a));
  });
});

describe("isDateWithinBooking", () => {
  it("يشمل تاريخ الدخول ولا يشمل تاريخ الخروج", () => {
    const checkIn = d("2026-09-10");
    const checkOut = d("2026-09-12");
    expect(isDateWithinBooking(d("2026-09-10"), checkIn, checkOut)).toBe(true);
    expect(isDateWithinBooking(d("2026-09-11"), checkIn, checkOut)).toBe(true);
    expect(isDateWithinBooking(d("2026-09-12"), checkIn, checkOut)).toBe(false);
    expect(isDateWithinBooking(d("2026-09-09"), checkIn, checkOut)).toBe(false);
  });
});

describe("nightsBetween", () => {
  it("يحسب عدد الليالي كفرق الأيام بين الدخول والخروج", () => {
    expect(nightsBetween(d("2026-09-10"), d("2026-09-12"))).toBe(2);
    expect(nightsBetween(d("2026-09-10"), d("2026-09-11"))).toBe(1);
  });
});

describe("isValidDateOnly", () => {
  it("يقبل تاريخاً حقيقياً", () => {
    expect(isValidDateOnly("2026-02-28")).toBe(true);
    expect(isValidDateOnly("2028-02-29")).toBe(true);
  });
  it("يرفض تواريخ غير موجودة وصيغاً خاطئة", () => {
    expect(isValidDateOnly("2026-02-29")).toBe(false);
    expect(isValidDateOnly("2026-13-01")).toBe(false);
    expect(isValidDateOnly("2026-9-1")).toBe(false);
    expect(isValidDateOnly("abc")).toBe(false);
    expect(isValidDateOnly("")).toBe(false);
    expect(isValidDateOnly(null)).toBe(false);
  });
});

describe("todayDateOnly", () => {
  it("يعتمد يوم ليبيا لا يوم UTC (بين 00:00 و02:00 بتوقيت ليبيا)", () => {
    // 22:30 UTC يوم 29 = 00:30 يوم 30 في ليبيا (UTC+2)
    expect(formatDateOnly(todayDateOnly(new Date("2026-09-29T22:30:00Z")))).toBe("2026-09-30");
    expect(formatDateOnly(todayDateOnly(new Date("2026-09-29T12:00:00Z")))).toBe("2026-09-29");
  });
});

describe("nightsWithin", () => {
  it("يقسم ليالي حجز يمتد عبر شهرين", () => {
    const sepStart = d("2026-09-01");
    const octStart = d("2026-10-01");
    const novStart = d("2026-11-01");
    // 29 سبتمبر → 3 أكتوبر: ليلتان في سبتمبر (29، 30) وليلتان في أكتوبر (1، 2)
    expect(nightsWithin(d("2026-09-29"), d("2026-10-03"), sepStart, octStart)).toBe(2);
    expect(nightsWithin(d("2026-09-29"), d("2026-10-03"), octStart, novStart)).toBe(2);
  });
  it("صفر لحجز خارج الفترة", () => {
    expect(nightsWithin(d("2026-08-01"), d("2026-08-05"), d("2026-09-01"), d("2026-10-01"))).toBe(0);
  });
});

describe("nightsLabel", () => {
  it("صيغة العدد العربية", () => {
    expect(nightsLabel(1)).toBe("ليلة واحدة");
    expect(nightsLabel(2)).toBe("ليلتان");
    expect(nightsLabel(5)).toBe("5 ليالٍ");
    expect(nightsLabel(14)).toBe("14 ليلة");
  });
});
