"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  children,
  className = "btn-primary",
  pendingLabel = "جارٍ الحفظ...",
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
