import { describe, expect, it } from "vitest";
import { buildPaymentRecord, normalizePaymentMethod, normalizePaymentStatus } from "./payment";

describe("payment helpers", () => {
  it("normalizes payment method and status values", () => {
    expect(normalizePaymentMethod("credit card")).toBe("Credit Card");
    expect(normalizePaymentMethod("UPI")).toBe("UPI");
    expect(normalizePaymentStatus("paid")).toBe("Paid");
    expect(normalizePaymentStatus("refunded")).toBe("Refunded");
  });

  it("builds payment data from a reservation", () => {
    const payment = buildPaymentRecord({
      reservationId: "res_123",
      amount: 4200,
      method: "wallet",
      status: "pending",
      reservation: {
        id: "res_123",
        guest: { firstName: "Ava", lastName: "Singh" },
        roomId: "room_42",
      },
    });

    expect(payment.guest).toBe("Ava Singh");
    expect(payment.roomId).toBe("room_42");
    expect(payment.status).toBe("Pending");
    expect(payment.method).toBe("Wallet");
  });
});
