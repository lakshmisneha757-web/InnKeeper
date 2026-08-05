/**
 * Mock digital-lock unlock sequence.
 * -------------------------------------------------------------------------
 * There's no physical lock in this demo, so this simulates the stages a
 * real BLE handshake goes through (scan for the device → connect → prove
 * the key is valid → send the unlock command) with realistic timing and
 * visible status text, instead of a single opaque "loading" spinner.
 *
 * A real integration (Web Bluetooth, or a lock vendor's native SDK like
 * Salto, dormakaba, or Assa Abloy) would replace `runUnlockSequence` with
 * actual `navigator.bluetooth` calls, but the stage list and UI below stay
 * the same shape.
 */

export type LockStage = "idle" | "searching" | "connecting" | "authenticating" | "sending" | "unlocked";

export const LOCK_STAGES: { key: LockStage; label: string; durationMs: number }[] = [
  { key: "searching", label: "Searching for lock 214…", durationMs: 1100 },
  { key: "connecting", label: "Connecting via Bluetooth…", durationMs: 900 },
  { key: "authenticating", label: "Authenticating digital key…", durationMs: 800 },
  { key: "sending", label: "Sending unlock command…", durationMs: 600 },
];

export const RELOCK_AFTER_MS = 6000;

/**
 * Drives `onStageChange` through each stage in sequence with the timings
 * above, finishing on "unlocked". Returns a cancel function so a component
 * can clean up if it unmounts mid-sequence.
 */
export function runUnlockSequence(onStageChange: (stage: LockStage) => void): () => void {
  const timeouts: ReturnType<typeof setTimeout>[] = [];
  let elapsed = 0;

  for (const stage of LOCK_STAGES) {
    timeouts.push(setTimeout(() => onStageChange(stage.key), elapsed));
    elapsed += stage.durationMs;
  }
  timeouts.push(setTimeout(() => onStageChange("unlocked"), elapsed));

  return () => timeouts.forEach(clearTimeout);
}
