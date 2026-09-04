"use client";

import { ChevronLeft, Building2, Globe } from "lucide-react";
import { CorridorRail } from "./CorridorRail";
import { useTranslation } from "react-i18next";
import "@/i18n";

export function ScreenShell({
  title,
  subtitle,
  onBack,
  stepIndex,
  footer,
  children,
}: {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  stepIndex?: number;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { i18n } = useTranslation();

  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col bg-white max-w-md mx-auto md:my-8 md:min-h-[640px] md:rounded-3xl md:border md:border-slate-200 md:shadow-sm overflow-hidden">
      <div className="px-5 pt-6 pb-3 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            {onBack ? (
              <button
                onClick={onBack}
                className="h-8 w-8 -ml-1.5 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 active:scale-95 transition"
                aria-label="Go back"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : (
              <div className="h-8 w-8 -ml-1.5" />
            )}
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-slate-400">
              <Building2 className="h-3.5 w-3.5" />
              InnKeeper
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100/80 rounded-lg px-2 py-1">
            <Globe className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={i18n.language || 'en'}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="bg-transparent text-[12px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="en">EN</option>
              <option value="hi">हिन्दी</option>
              <option value="te">తెలుగు</option>
            </select>
          </div>
        </div>
        {stepIndex !== undefined && <CorridorRail stepIndex={stepIndex} />}
        {title && (
          <div className="mt-4">
            <h1 className="text-[22px] font-semibold tracking-tight text-slate-900 leading-tight">
              {title}
            </h1>
            {subtitle && <p className="text-[14px] text-slate-500 mt-1 leading-snug">{subtitle}</p>}
          </div>
        )}
      </div>
      <div className="flex-1 px-5 pb-4">{children}</div>
      {footer && (
        <div className="shrink-0 px-5 pt-3 pb-6 border-t border-slate-100 bg-white">{footer}</div>
      )}
    </div>
  );
}
