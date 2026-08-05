// Thin, typed wrappers around the guest check-in API routes.
// Swap the mock delay/response for real `fetch` calls once the routes in
// app/api/guest/** are backed by Prisma + your payment/ID-verification
// providers — the call sites in the screen components don't need to change.

export async function getReservation(token: string) {
  const res = await fetch(`/api/guest/checkin/${token}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Unable to load reservation");
  return res.json();
}

export async function submitIdentity(token: string, idFile: File | null, selfieFile: File | null) {
  const form = new FormData();
  form.set("token", token);
  if (idFile) form.set("idDocument", idFile);
  if (selfieFile) form.set("selfie", selfieFile);

  const res = await fetch("/api/guest/verify-id", { method: "POST", body: form });

  // Always parse the JSON body — even on non-OK responses — so the UI can
  // display the proper "Verification failed" state instead of a generic error.
  let body: any;
  try {
    body = await res.json();
  } catch {
    // Body is not JSON (e.g. 502 from proxy); surface a failed result.
    return { status: "failed" as const, score: 0, distance: 1.0, errorReason: "Server error during verification. Please try again." };
  }

  // If the server returned a non-OK status but body has a status field, use it.
  // Otherwise surface as a failed result.
  if (!res.ok && !body?.status) {
    return { status: "failed" as const, score: body?.score ?? 0, distance: body?.distance ?? 1.0, errorReason: body?.errorReason ?? "Verification failed. Please try again." };
  }

  return body;
}

export async function authorizePayment(token: string, paymentMethodToken: string, billingZip: string) {
  const res = await fetch("/api/guest/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, paymentMethodToken, billingZip }),
  });
  if (!res.ok) throw new Error("Payment authorization failed");
  return res.json();
}

export async function completeCheckIn(token: string, policyAcceptedAt: string) {
  const res = await fetch("/api/guest/checkin/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, policyAcceptedAt }),
  });
  if (!res.ok) throw new Error("Unable to complete check-in");
  return res.json();
}

export async function getDigitalKey(reservationId: string) {
  const res = await fetch(`/api/guest/digital-key/${reservationId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Unable to load digital key");
  return res.json();
}
