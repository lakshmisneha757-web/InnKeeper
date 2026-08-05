"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bluetooth, QrCode, Lock, Unlock, Loader2, Check } from "lucide-react";
import { ScreenShell } from "./ScreenShell";
import { getDigitalKey } from "@/lib/api-client";
import { RESERVATION } from "@/lib/mock-data";
import { LOCK_STAGES, RELOCK_AFTER_MS, runUnlockSequence, type LockStage } from "@/lib/lock-sequence";
import { useCheckIn } from "./CheckInProvider";

export function KeyScreen() {
  const router = useRouter();
  const { token } = useCheckIn();
  const [stage, setStage] = useState<LockStage>("idle");
  const [keyLoaded, setKeyLoaded] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    getDigitalKey("res_demo_1").finally(() => setKeyLoaded(true));
    return () => cancelRef.current?.();
  }, []);

  const unlock = () => {
    if (stage !== "idle") return;
    cancelRef.current = runUnlockSequence(setStage);
  };

  useEffect(() => {
    if (stage !== "unlocked") return;
    const t = setTimeout(() => setStage("idle"), RELOCK_AFTER_MS);
    return () => clearTimeout(t);
  }, [stage]);

  const activeStageIndex = LOCK_STAGES.findIndex((s) => s.key === stage);
  const isRunning = stage !== "idle" && stage !== "unlocked";

  return (
    <ScreenShell stepIndex={5} onBack={() => router.push(`/checkin/${token}/success`)}>
      <div className="pt-1 pb-2">
        <div
          className="relative rounded-[22px] p-5 text-white overflow-hidden shadow-xl shadow-blue-900/20"
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 45%, #2563eb 65%, #3b82f6 100%)",
          }}
        >
          <div
            className="absolute inset-0 opacity-40 mix-blend-overlay"
            style={{
              background: "linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.5) 35%, transparent 50%)",
            }}
          />
          <div className="absolute -right-8 -bottom-10 h-40 w-40 rounded-full bg-white/5" />

          <div className="relative flex items-start justify-between mb-8">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-blue-200 font-medium">
                {RESERVATION.hotelName}
              </p>
              <p className="text-[12px] text-blue-100 mt-0.5">Digital room key</p>
            </div>
            <div className="h-8 w-11 rounded-md bg-white/15 border border-white/20 flex items-center justify-center">
              <div className="h-4 w-6 rounded-sm bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-80" />
            </div>
          </div>

          <div className="relative flex items-end justify-between">
            <div>
              <p className="text-[11px] text-blue-200">Room</p>
              <p className="text-[40px] leading-none font-semibold tracking-tight">
                {RESERVATION.roomNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-blue-200">Valid until</p>
              <p className="text-[13px] font-medium">{RESERVATION.checkoutTime}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 mb-6 px-1">
          <div className="flex items-center gap-1.5 text-[12.5px] text-slate-500">
            <Bluetooth className={`h-3.5 w-3.5 ${keyLoaded ? "text-blue-500" : "text-slate-300"}`} />
            {keyLoaded ? "Digital key ready" : "Loading key…"}
          </div>
          <button
            type="button"
            onClick={() => setShowQr((value) => !value)}
            className="flex items-center gap-1.5 text-[12.5px] text-slate-400 hover:text-slate-600"
          >
            <QrCode className="h-3.5 w-3.5" /> {showQr ? "Show key card" : "Show QR instead"}
          </button>
        </div>

        <div className="flex flex-col items-center justify-center py-4">
          {showQr ? (
            <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-popIn">
              <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-2xl bg-white p-3 border border-slate-100 shadow-inner">
                <svg viewBox="0 0 21 21" className="h-full w-full shape-rendering-crisp">
                  {renderQrMatrix(token).map((row, r) =>
                    row.map((fill, c) =>
                      fill ? (
                        <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#1e3a8a" rx={0.1} />
                      ) : null
                    )
                  )}
                </svg>
              </div>
              <div className="mt-4 text-center">
                <p className="text-[13.5px] font-semibold text-slate-800">Room {RESERVATION.roomNumber} Key QR Code</p>
                <p className="mt-1 text-[12px] text-slate-500 max-w-[260px] mx-auto">
                  Hold this QR code near the optical door scanner to gain entry.
                </p>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={unlock}
                disabled={stage !== "idle" || !keyLoaded}
                className={[
                  "relative h-36 w-36 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-300 active:scale-95",
                  stage === "unlocked"
                    ? "bg-emerald-50 ring-4 ring-emerald-100"
                    : "bg-blue-50 ring-4 ring-blue-100 hover:ring-blue-200",
                ].join(" ")}
              >
                {stage === "idle" && (
                  <>
                    <Lock className="h-9 w-9 text-blue-600" />
                    <span className="text-[13.5px] font-semibold text-blue-600">Tap to unlock</span>
                  </>
                )}
                {isRunning && (
                  <>
                    <Loader2 className="h-9 w-9 text-blue-600 animate-spin" />
                    <span className="text-[12.5px] font-semibold text-blue-600 text-center px-4 leading-tight">
                      {LOCK_STAGES[activeStageIndex]?.label ?? "Working…"}
                    </span>
                  </>
                )}
                {stage === "unlocked" && (
                  <>
                    <Unlock className="h-9 w-9 text-emerald-600 animate-popIn" />
                    <span className="text-[13.5px] font-semibold text-emerald-600">Door unlocked</span>
                  </>
                )}
              </button>

              {/* Step-by-step handshake log — gives visible feedback for each
                  stage instead of a single opaque spinner. */}
              {(isRunning || stage === "unlocked") && (
                <div className="w-full mt-6 rounded-2xl bg-slate-50 px-4 py-3.5 space-y-2.5">
                  {LOCK_STAGES.map((s, i) => {
                    const done = i < activeStageIndex || stage === "unlocked";
                    const active = i === activeStageIndex && stage !== "unlocked";
                    return (
                      <div key={s.key} className="flex items-center gap-2.5">
                        <div
                          className={[
                            "h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-colors",
                            done ? "bg-emerald-500" : active ? "bg-blue-600" : "bg-slate-200",
                          ].join(" ")}
                        >
                          {done ? (
                            <Check className="h-3 w-3 text-white" />
                          ) : active ? (
                            <Loader2 className="h-3 w-3 text-white animate-spin" />
                          ) : null}
                        </div>
                        <span
                          className={[
                            "text-[13px] transition-colors",
                            done ? "text-slate-500" : active ? "text-slate-900 font-medium" : "text-slate-300",
                          ].join(" ")}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-[12px] text-slate-400 mt-4 text-center max-w-[240px]">
                {stage === "unlocked"
                  ? "Door is open. It will relock automatically in a few seconds."
                  : isRunning
                  ? "Stay near the door while your key connects."
                  : "Tap the icon while standing near your door."}
              </p>
            </>
          )}
        </div>
      </div>
    </ScreenShell>
  );
}

function renderQrMatrix(seed: string): boolean[][] {
  const size = 21;
  const safeSeed = seed && seed.length > 0 ? seed : "DEMO_KEY_TOKEN";
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const addFinder = (startRow: number, startCol: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInnerSquare = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[startRow + r][startCol + c] = isOuter || isInnerSquare;
      }
    }
  };

  addFinder(0, 0);
  addFinder(0, 14);
  addFinder(14, 0);

  for (let i = 7; i < 14; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const isTopLeftFinder = r < 8 && c < 8;
      const isTopRightFinder = r < 8 && c > 12;
      const isBottomLeftFinder = r > 12 && c < 8;
      const isTiming = (r === 6 && c >= 7 && c <= 13) || (c === 6 && r >= 7 && r <= 13);

      if (!isTopLeftFinder && !isTopRightFinder && !isBottomLeftFinder && !isTiming) {
        const charCode = safeSeed.charCodeAt((r * size + c) % safeSeed.length);
        matrix[r][c] = (r + c + charCode) % 3 === 0 || (r * c + charCode) % 5 === 0;
      }
    }
  }

  return matrix;
}

