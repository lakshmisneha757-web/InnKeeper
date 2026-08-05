import { NextRequest, NextResponse } from "next/server";
import { RESERVATION } from "@/lib/mock-data";

// GET /api/guest/digital-key/:reservationId
// JWT-authenticated in production; re-fetched every time the guest opens
// Screen 6 so an expired or revoked key is caught immediately rather than
// trusting a cached value.
//
// Real implementation:
//   const key = await prisma.digitalKey.findUnique({ where: { reservationId } });
//   if (!key || key.revokedAt || key.validUntil < new Date()) {
//     return NextResponse.json({ error: "expired" }, { status: 410 });
//   }
//   return NextResponse.json({ encryptedKeyPayload: key.encryptedPayload, ... });
export async function GET(_req: NextRequest, { params }: { params: { reservationId: string } }) {
  if (!params.reservationId) {
    return NextResponse.json({ error: "Missing reservation id" }, { status: 400 });
  }

  return NextResponse.json({
    encryptedKeyPayload: "demo-encrypted-payload",
    lockDeviceId: "lock_214",
    roomNumber: RESERVATION.roomNumber,
    validFrom: RESERVATION.checkIn,
    validUntil: RESERVATION.checkoutTime,
  });
}
