"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** يقفل القائمة الجانبية على الهاتف تلقائياً بعد الانتقال لصفحة جديدة. */
export default function MobileNavAutoClose() {
  const pathname = usePathname();

  useEffect(() => {
    const checkbox = document.getElementById("nav-toggle") as HTMLInputElement | null;
    if (checkbox) checkbox.checked = false;
  }, [pathname]);

  return null;
}
