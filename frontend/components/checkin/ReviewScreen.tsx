"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Users, BedDouble, CalendarDays } from "lucide-react";
import { ScreenShell } from "./ScreenShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { completeCheckIn } from "@/lib/api-client";
import { RESERVATION } from "@/lib/mock-data";
import { useCheckIn } from "./CheckInProvider";

export function ReviewScreen() {
  const router = useRouter();
  const { token, paymentAuthorized, setCheckedIn } = useCheckIn();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Step guard: don't allow completing check-in before payment is authorized.
  useEffect(() => {
    if (!paymentAuthorized) router.replace(`/checkin/${token}/payment`);
  }, [paymentAuthorized, router, token]);

  const complete = async () => {
    setSubmitting(true);
    const result = await completeCheckIn(token, new Date().toISOString());
    setSubmitting(false);
    setCheckedIn(true, result.roomNumber);
    router.push(`/checkin/${token}/success`);
  };

  return (
    <ScreenShell
      stepIndex={3}
      onBack={() => router.push(`/checkin/${token}/payment`)}
      title="Review & complete"
      subtitle="Double-check the details before we assign your room."
      footer={
        <Button onClick={complete} disabled={!agreed} loading={submitting}>
          Complete check-in
        </Button>
      }
    >
      <div className="rounded-2xl border border-slate-100 divide-y divide-slate-100 mb-4">
        <Row icon={<Users className="h-4 w-4" />} label="Guest" value={RESERVATION.guestName} />
        <Row icon={<BedDouble className="h-4 w-4" />} label="Room type" value={RESERVATION.roomType} />
        <Row icon={<CalendarDays className="h-4 w-4" />} label="Arrival" value={RESERVATION.checkIn} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatusPill label="Identity" value="Verified" />
        <StatusPill label="Payment" value={paymentAuthorized ? "Authorized" : "Pending"} />
      </div>

      <div className="rounded-2xl bg-slate-50 p-4 mb-5">
        <p className="text-[13px] font-medium text-slate-600 mb-1.5">Motel policies</p>
        <p className="text-[12.5px] text-slate-400 leading-relaxed">
          Quiet hours 10pm–8am. No smoking in rooms. Maximum {RESERVATION.guests} guests per room.
          A valid ID may be requested at any time during your stay. Late checkout after 11am
          incurs a half-day rate.
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer select-none">
        <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
        <span className="text-[13.5px] text-slate-600">I agree to the motel policies above.</span>
      </label>
    </ScreenShell>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2.5 text-slate-500">
        {icon}
        <span className="text-[14px]">{label}</span>
      </div>
      <span className="text-[14px] font-medium text-slate-900">{value}</span>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  const active = value !== "Pending";
  return (
    <div className={`rounded-xl px-3.5 py-3 ${active ? "bg-emerald-50" : "bg-slate-50"}`}>
      <p className={`text-[11.5px] font-medium ${active ? "text-emerald-600/70" : "text-slate-400"}`}>
        {label}
      </p>
      <div className="flex items-center gap-1.5 mt-0.5">
        {active && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
        <span className={`text-[13.5px] font-semibold ${active ? "text-emerald-700" : "text-slate-500"}`}>
          {value}
        </span>
      </div>
    </div>
  );
}
