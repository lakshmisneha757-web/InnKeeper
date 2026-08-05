"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BedDouble, CalendarDays, Users, Info } from "lucide-react";
import { ScreenShell } from "./ScreenShell";
import { Skeleton } from "./Skeleton";
import { Button } from "@/components/ui/button";
import { getReservation } from "@/lib/api-client";
import { money, type ReservationSummary } from "@/lib/mock-data";

export function WelcomeScreen({ token }: { token: string }) {
  const router = useRouter();
  const [reservation, setReservation] = useState<ReservationSummary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getReservation(token)
      .then((data) => !cancelled && setReservation(data))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) {
    return (
      <ScreenShell>
        <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-10">
          <p className="text-[16px] font-semibold text-slate-900">This link has expired</p>
          <p className="text-[13.5px] text-slate-500 max-w-xs">
            Secure check-in links are only valid for 48 hours. Text the front desk to get a new one.
          </p>
        </div>
      </ScreenShell>
    );
  }

  if (!reservation) {
    return (
      <ScreenShell stepIndex={0}>
        <div className="pt-2 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-40 w-full" />
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      stepIndex={0}
      footer={
        <Button onClick={() => router.push(`/checkin/${token}/verify`)}>
          Start check-in <ArrowRight className="h-4 w-4" />
        </Button>
      }
    >
      <div className="pt-1">
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white p-5 mb-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute -right-2 top-10 h-16 w-16 rounded-full bg-white/10" />
          <p className="text-[13px] text-blue-100 font-medium">Welcome,</p>
          <h2 className="text-[24px] font-semibold tracking-tight">{reservation.guestName}</h2>
          <p className="text-[13px] text-blue-100 mt-1">
            Confirmation #{reservation.confirmationNumber}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 divide-y divide-slate-100 mb-5">
          <Row icon={<BedDouble className="h-4 w-4" />} label="Room type" value={reservation.roomType} />
          <Row icon={<CalendarDays className="h-4 w-4" />} label="Check-in" value={reservation.checkIn} />
          <Row icon={<CalendarDays className="h-4 w-4" />} label="Check-out" value={reservation.checkOut} />
          <Row icon={<Users className="h-4 w-4" />} label="Guests" value={`${reservation.guests} guests`} />
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 mb-4">
          <p className="text-[13px] font-medium text-slate-600 mb-2">Room charges</p>
          <div className="flex justify-between text-[14px] text-slate-500 mb-1">
            <span>
              {reservation.nights} nights × {money(reservation.roomRate)}
            </span>
            <span>{money(reservation.nights * reservation.roomRate)}</span>
          </div>
          <div className="flex justify-between text-[14px] text-slate-500">
            <span>Taxes &amp; fees</span>
            <span>{money(reservation.taxes)}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 text-[12.5px] text-slate-400 mb-2">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Check-in takes about 3 minutes. Have a photo ID ready.</span>
        </div>
      </div>
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
