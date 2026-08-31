import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: process.env.DATABASE_URL ? new PrismaPg({ connectionString: process.env.DATABASE_URL }) : undefined,
});

export async function GET(_req: NextRequest, { params }: { params: { reservationId: string } }) {
  const reservationId = params.reservationId;
  if (!reservationId) {
    return NextResponse.json({ error: "Missing reservation id" }, { status: 400 });
  }

  const key = await prisma.digitalKey.findFirst({
    where: { reservationId },
  });

  if (!key) {
    return NextResponse.json({ error: "No digital key found" }, { status: 404 });
  }

  if (key.status === "REVOKED" || key.validUntil < new Date()) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }

  return NextResponse.json({
    encryptedKeyPayload: key.encryptedKey || key.encryptedPayload,
    lockDeviceId: key.lockDeviceId || key.lockId,
    roomNumber: key.roomNumber,
    validFrom: key.validFrom,
    validUntil: key.validUntil,
    status: key.status,
    unlockCount: key.unlockCount,
  });
}
