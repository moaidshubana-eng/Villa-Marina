import { describe, it, expect } from "vitest";
import { bookingsOverlap, isDateWithinBooking, parseDateOnly, nightsBetween } from "./rental";

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
