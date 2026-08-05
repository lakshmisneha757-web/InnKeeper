"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock } from "lucide-react";
import { ScreenShell } from "./ScreenShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authorizePayment } from "@/lib/api-client";
import { paymentSchema } from "@/lib/validation";
import { RESERVATION, money } from "@/lib/mock-data";
import { useCheckIn } from "./CheckInProvider";

// ---------------------------------------------------------------------------
// Card network detection
// ---------------------------------------------------------------------------
type CardNetwork = "visa" | "mastercard" | "amex" | "discover" | "unknown";

function detectNetwork(raw: string): CardNetwork {
  const v = raw.replace(/\s/g, "");
  if (/^4/.test(v)) return "visa";
  if (/^5[1-5]/.test(v) || /^2(2[2-9][1-9]|[3-6]\d{2}|7[01]\d|720)/.test(v))
    return "mastercard";
  if (/^3[47]/.test(v)) return "amex";
  if (/^(6011|622|64[4-9]|65)/.test(v)) return "discover";
  return "unknown";
}

const NETWORK_LABELS: Record<CardNetwork, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  unknown: "",
};

const NETWORK_COLORS: Record<CardNetwork, string> = {
  visa: "#1A1F71",
  mastercard: "#EB001B",
  amex: "#007BC1",
  discover: "#FF6600",
  unknown: "#94a3b8",
};

// ---------------------------------------------------------------------------
// Format card number (Amex: 4-6-5, others: 4-4-4-4)
// ---------------------------------------------------------------------------
function formatCard(v: string, network: CardNetwork): string {
  const digits = v.replace(/\D/g, "");
  if (network === "amex") {
    const d = digits.slice(0, 15);
    if (d.length <= 4) return d;
    if (d.length <= 10) return `${d.slice(0, 4)} ${d.slice(4)}`;
    return `${d.slice(0, 4)} ${d.slice(4, 10)} ${d.slice(10)}`;
  }
  return digits
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PaymentScreen() {
  const router = useRouter();
  const { token, idVerified, setPaymentAuthorized } = useCheckIn();

  useEffect(() => {
    if (!idVerified) router.replace(`/checkin/${token}/verify`);
  }, [idVerified, router, token]);

  const [form, setForm] = useState({ name: "", number: "", expiry: "", cvv: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const network = detectNetwork(form.number);

  const total =
    RESERVATION.nights * RESERVATION.roomRate + RESERVATION.taxes + RESERVATION.incidentalHold;

  // Map form fields → schema fields
  const parsed = paymentSchema.safeParse({
    cardholderName: form.name,
    cardNumber: form.number,
    expiry: form.expiry,
    cvv: form.cvv,
  });

  const fieldError = (key: string): string | null => {
    if (!touched[key]) return null;
    if (parsed.success) return null;
    const issue = parsed.error.issues.find((i) => i.path[0] === key);
    return issue?.message ?? null;
  };

  const touch = (key: string) =>
    setTouched((t) => ({ ...t, [key]: true }));

  const submit = async () => {
    setTouched({ cardholderName: true, cardNumber: true, expiry: true, cvv: true });
    if (!parsed.success) return;

    setProcessing(true);
    setServerError(null);
    try {
      await authorizePayment(token, "demo-payment-method-token", "");
      setProcessing(false);
      setSuccess(true);
      setPaymentAuthorized(true);
      setTimeout(() => router.push(`/checkin/${token}/review`), 700);
    } catch {
      setProcessing(false);
      setServerError("Your card was declined. Please try a different card.");
    }
  };

  if (success) {
    return (
      <ScreenShell stepIndex={2}>
        <div className="h-full flex flex-col items-center justify-center gap-4 py-10">
          <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center animate-popIn">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <div className="text-center">
            <p className="text-[17px] font-semibold text-slate-900">Payment authorized</p>
            <p className="text-[13px] text-slate-400 mt-1">{money(total)} held on your card</p>
          </div>
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      stepIndex={2}
      onBack={() => router.push(`/checkin/${token}/verify`)}
      title="Payment"
      subtitle="Your card is authorized now and charged at checkout."
      footer={
        <Button onClick={submit} loading={processing} disabled={processing}>
          <Lock className="h-4 w-4" /> Authorize {money(total)}
        </Button>
      }
    >
      {/* ── Charge summary ── */}
      <div className="rounded-2xl bg-slate-50 p-4 mb-5 space-y-1.5">
        <div className="flex justify-between text-[13.5px] text-slate-500">
          <span>Room charge</span>
          <span>{money(RESERVATION.nights * RESERVATION.roomRate)}</span>
        </div>
        <div className="flex justify-between text-[13.5px] text-slate-500">
          <span>Taxes</span>
          <span>{money(RESERVATION.taxes)}</span>
        </div>
        <div className="flex justify-between text-[13.5px] text-slate-500">
          <span>Incidental deposit hold</span>
          <span>{money(RESERVATION.incidentalHold)}</span>
        </div>
        <div className="h-px bg-slate-200 my-2" />
        <div className="flex justify-between text-[14.5px] font-semibold text-slate-900">
          <span>Total authorization</span>
          <span>{money(total)}</span>
        </div>
      </div>

      {/* ── Server error ── */}
      {serverError && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-3.5 py-3 mb-4 text-[13px] flex items-start gap-2">
          <span className="mt-0.5">⚠️</span>
          <span>{serverError}</span>
        </div>
      )}

      {/* ── Form ── */}
      <div className="space-y-3.5">
        {/* Cardholder name */}
        <Field label="Cardholder name" error={fieldError("cardholderName")}>
          <Input
            id="cardholder-name"
            placeholder="Miguel Santos"
            hasError={!!fieldError("cardholderName")}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            onBlur={() => touch("cardholderName")}
            autoComplete="cc-name"
          />
        </Field>

        {/* Card number */}
        <Field label="Card number" error={fieldError("cardNumber")}>
          <div className="relative">
            <Input
              id="card-number"
              placeholder="1234 5678 9012 3456"
              inputMode="numeric"
              className="pr-24"
              hasError={!!fieldError("cardNumber")}
              value={form.number}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  number: formatCard(e.target.value, detectNetwork(e.target.value)),
                }))
              }
              onBlur={() => touch("cardNumber")}
              autoComplete="cc-number"
            />
            {/* Card network badge */}
            {network !== "unknown" && (
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: NETWORK_COLORS[network] }}
              >
                {NETWORK_LABELS[network]}
              </span>
            )}
          </div>
        </Field>

        {/* Expiry + CVV */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Expiry" error={fieldError("expiry")}>
            <Input
              id="card-expiry"
              placeholder="MM/YY"
              inputMode="numeric"
              hasError={!!fieldError("expiry")}
              value={form.expiry}
              onChange={(e) =>
                setForm((f) => ({ ...f, expiry: formatExpiry(e.target.value) }))
              }
              onBlur={() => touch("expiry")}
              autoComplete="cc-exp"
              maxLength={5}
            />
          </Field>
          <Field
            label={`CVV${network === "amex" ? " (4 digits)" : ""}`}
            error={fieldError("cvv")}
          >
            <Input
              id="card-cvv"
              placeholder={network === "amex" ? "1234" : "123"}
              inputMode="numeric"
              maxLength={network === "amex" ? 4 : 3}
              hasError={!!fieldError("cvv")}
              value={form.cvv}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  cvv: e.target.value.replace(/\D/g, "").slice(0, network === "amex" ? 4 : 3),
                }))
              }
              onBlur={() => touch("cvv")}
              autoComplete="cc-csc"
            />
          </Field>
        </div>
      </div>
    </ScreenShell>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-medium text-slate-500 mb-1.5 block">{label}</span>
      {children}
      {error && (
        <span className="text-[12px] text-red-500 mt-1 flex items-center gap-1 block">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 flex-shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </span>
      )}
    </label>
  );
}

