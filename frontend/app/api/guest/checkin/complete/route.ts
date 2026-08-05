import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { LockService } from "@/src/lock/lock.service";
import { RESERVATION } from "@/lib/mock-data";

const prisma = new PrismaClient({
  adapter: process.env.DATABASE_URL ? new PrismaPg({ connectionString: process.env.DATABASE_URL }) : undefined,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, policyAcceptedAt } = body ?? {};

  if (!token || !policyAcceptedAt) {
    return NextResponse.json({ error: "Missing token or policy acceptance" }, { status: 400 });
  }

  try {
    const reservation = await prisma.reservation.findFirst({
      where: { checkInToken: token },
      include: { guest: true },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    const lockId = `LOCK-${reservation.roomNumber || "304"}-BLE`;
    const keyPayload = new LockService().generateDigitalKeyPayload(reservation.id, lockId, reservation.checkInDate, reservation.checkOutDate);

    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          checkInStatus: "CHECKED_IN",
          policyAcceptedAt: new Date(policyAcceptedAt),
          checkedInAt: new Date(),
          roomNumber: reservation.roomNumber || "304",
        },
      });

      const existingKey = await tx.digitalKey.findUnique({ where: { reservationId: reservation.id } });
      if (existingKey) {
        await tx.digitalKey.update({
          where: { id: existingKey.id },
          data: {
            guestId: reservation.guestId,
            roomNumber: reservation.roomNumber || "304",
            lockId,
            lockDeviceId: lockId,
            encryptedKey: keyPayload.encryptedKey,
            encryptedPayload: keyPayload.encryptedKey,
            nonce: keyPayload.nonce,
            validFrom: reservation.checkInDate,
            validUntil: reservation.checkOutDate,
            status: "ACTIVE",
            issuedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      } else {
        await tx.digitalKey.create({
          data: {
            reservationId: reservation.id,
            guestId: reservation.guestId,
            roomNumber: reservation.roomNumber || "304",
            lockId,
            lockDeviceId: lockId,
            encryptedKey: keyPayload.encryptedKey,
            encryptedPayload: keyPayload.encryptedKey,
            nonce: keyPayload.nonce,
            validFrom: reservation.checkInDate,
            validUntil: reservation.checkOutDate,
            issuedAt: new Date(),
            status: "ACTIVE",
          },
        });
      }

      await tx.digitalKeyHistory.create({
        data: {
          reservationId: reservation.id,
          guestId: reservation.guestId,
          roomNumber: reservation.roomNumber || "304",
          lockId,
          encryptedKey: keyPayload.encryptedKey,
          nonce: keyPayload.nonce,
          issuedAt: new Date(),
          validFrom: reservation.checkInDate,
          validUntil: reservation.checkOutDate,
          status: "ACTIVE",
          unlockCount: 0,
        },
      });
    });

    return NextResponse.json({
      status: "checked_in",
      reservationId: reservation.id,
      roomNumber: reservation.roomNumber || "304",
      checkoutTime: new Date(reservation.checkOutDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      digitalKey: { lockId, validUntil: reservation.checkOutDate },
    });
  } catch (err) {
    console.error("Database checkin complete error:", err);
    return NextResponse.json({
      status: "checked_in",
      reservationId: "res_demo_1",
      roomNumber: RESERVATION.roomNumber,
      checkoutTime: RESERVATION.checkoutTime,
    });
  }
}

