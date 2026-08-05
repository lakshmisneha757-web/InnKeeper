import { STEPS } from "@/lib/mock-data";

export function CorridorRail({ stepIndex }: { stepIndex: number }) {
  return (
    <div className="flex items-center gap-1.5 px-1" aria-label="Check-in progress">
      {STEPS.map((s, i) => {
        const done = i < stepIndex;
        const active = i === stepIndex;
        return (
          <div key={s.key} className="flex items-center flex-1 last:flex-none">
            <div
              className={[
                "relative h-2 rounded-full transition-all duration-500 ease-out flex-1",
                done || active ? "bg-blue-600" : "bg-slate-200",
                active ? "shadow-[0_0_0_3px_rgba(37,99,235,0.15)]" : "",
              ].join(" ")}
              style={{ minWidth: 10 }}
            />
            {i < STEPS.length - 1 && <div className="w-1" />}
          </div>
        );
      })}
    </div>
  );
}
