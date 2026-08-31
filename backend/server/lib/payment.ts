export function normalizePaymentMethod(method?: string | null) {
  const normalized = (method ?? "Cash").toString().trim();
  const map: Record<string, string> = {
    cash: "Cash",
    creditcard: "Credit Card",
    credit: "Credit Card",
    card: "Credit Card",
    debitcard: "Debit Card",
    debit: "Debit Card",
    upi: "UPI",
    wallet: "Wallet",
    banktransfer: "Bank Transfer",
    bank: "Bank Transfer",
    "bank transfer": "Bank Transfer",
    "credit card": "Credit Card",
    "debit card": "Debit Card",
  };
  return map[normalized.toLowerCase()] ?? normalized;
}

export function normalizePaymentStatus(status?: string | null) {
  const normalized = (status ?? "Pending").toString().trim();
  const map: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
  };
  return map[normalized.toLowerCase()] ?? normalized;
}

export function buildPaymentRecord(input: {
  reservationId?: string | number | null;
  amount: number;
  method?: string | null;
  status?: string | null;
  reservation?: any;
}) {
  const guestName = input.reservation?.guest
    ? `${input.reservation.guest.firstName ?? ""} ${input.reservation.guest.lastName ?? ""}`.trim()
    : "";

  return {
    reservationId: input.reservationId,
    guest: guestName || "Unknown Guest",
    roomId: input.reservation?.roomId ?? "",
    amount: input.amount,
    method: normalizePaymentMethod(input.method),
    status: normalizePaymentStatus(input.status),
  };
}
