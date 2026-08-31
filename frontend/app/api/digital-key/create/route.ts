import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { LockService } from "@/src/lock/lock.service";

const prisma = new PrismaClient({
  adapter: process.env.DATABASE_URL ? new PrismaPg({ connectionString: process.env.DATABASE_URL }) : undefined,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { reservationId, roomNumber, lockId } = body ?? {};

  if (!reservationId) {
    return NextResponse.json({ error: "Missing reservationId" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId }, include: { guest: true } });
  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  const targetLockId = lockId || `LOCK-${roomNumber || reservation.roomNumber || "304"}-BLE`;
  const keyPayload = new LockService().generateDigitalKeyPayload(reservation.id, targetLockId, reservation.checkInDate, reservation.checkOutDate);

  const digitalKey = await prisma.$transaction(async (tx) => {
    const existing = await tx.digitalKey.findUnique({ where: { reservationId: reservation.id } });
    if (existing) {
      return tx.digitalKey.update({
        where: { id: existing.id },
        data: {
          guestId: reservation.guestId,
          roomNumber: reservation.roomNumber || roomNumber || "304",
          lockId: targetLockId,
          lockDeviceId: targetLockId,
          encryptedKey: keyPayload.encryptedKey,
          encryptedPayload: keyPayload.encryptedKey,
          nonce: keyPayload.nonce,
          issuedAt: new Date(),
          validFrom: reservation.checkInDate,
          validUntil: reservation.checkOutDate,
          status: "ACTIVE",
        },
      });
    }

    return tx.digitalKey.create({
      data: {
        reservationId: reservation.id,
        guestId: reservation.guestId,
        roomNumber: reservation.roomNumber || roomNumber || "304",
        lockId: targetLockId,
        lockDeviceId: targetLockId,
        encryptedKey: keyPayload.encryptedKey,
        encryptedPayload: keyPayload.encryptedKey,
        nonce: keyPayload.nonce,
        issuedAt: new Date(),
        validFrom: reservation.checkInDate,
        validUntil: reservation.checkOutDate,
        status: "ACTIVE",
      },
    });
  });

  return NextResponse.json({
    status: "created",
    digitalKeyId: digitalKey.id,
    reservationId: reservation.id,
    lockId: targetLockId,
    encryptedKey: digitalKey.encryptedKey,
    nonce: digitalKey.nonce,
    validFrom: digitalKey.validFrom,
    validUntil: digitalKey.validUntil,
  });
}
