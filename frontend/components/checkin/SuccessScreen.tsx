"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, KeyRound } from "lucide-react";
import { ScreenShell } from "./ScreenShell";
import { Button } from "@/components/ui/button";
import { RESERVATION } from "@/lib/mock-data";
import { useCheckIn } from "./CheckInProvider";

export function SuccessScreen() {
  const router = useRouter();
  const { token, roomNumber } = useCheckIn();

  return (
    <ScreenShell stepIndex={4}>
      <div className="h-full flex flex-col items-center justify-center text-center py-6">
        <div className="relative mb-6">
          <div className="h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center animate-popIn">
            <CheckCircle2 className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">Check-in complete</h1>
        <p className="text-[14px] text-slate-500 mt-1.5 mb-6">
          You&apos;re all set, {RESERVATION.guestName.split(" ")[0]}.
        </p>

        <div className="w-full rounded-2xl border border-slate-100 p-5 mb-3">
          <p className="text-[12.5px] text-slate-400 mb-1">Room assigned</p>
          <p className="text-[32px] font-semibold text-blue-600 tracking-tight">
            {roomNumber ?? RESERVATION.roomNumber}
          </p>
          <p className="text-[12.5px] text-slate-400 mt-1">Second floor, poolside wing</p>
        </div>

        <div className="w-full rounded-2xl bg-slate-50 p-4 text-left mb-2">
          <p className="text-[13px] font-medium text-slate-600 mb-1">Arrival instructions</p>
          <p className="text-[12.5px] text-slate-400 leading-relaxed">
            Enter through the poolside gate; your room is the third door on your left. Your
            digital key unlocks both the gate and your room.
          </p>
        </div>
        <div className="w-full flex justify-between text-[12.5px] text-slate-400 px-1 mb-6">
          <span>Estimated checkout</span>
          <span className="font-medium text-slate-600">{RESERVATION.checkoutTime}</span>
        </div>
      </div>
      <div className="pb-1">
        <Button onClick={() => router.push(`/checkin/${token}/key`)}>
          <KeyRound className="h-4 w-4" /> View digital key
        </Button>
      </div>
    </ScreenShell>
  );
}
