"use client";

import { useEffect } from "react";

export function Toast({
  message,
  tone = "default",
  onClose,
}: {
  message: string;
  tone?: "default" | "error" | "success";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 2600);
    return () => clearTimeout(t);
  }, [onClose]);

  const tones = {
    default: "bg-slate-900 text-white",
    error: "bg-red-600 text-white",
    success: "bg-emerald-600 text-white",
  } as const;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 flex justify-center z-50">
      <div className={`pointer-events-auto ${tones[tone]} text-[13px] font-medium px-4 py-2.5 rounded-full shadow-lg animate-toastIn`}>
        {message}
      </div>
    </div>
  );
}
