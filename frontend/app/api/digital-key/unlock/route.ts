import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { LockService } from "@/src/lock/lock.service";

const prisma = new PrismaClient({
  adapter: process.env.DATABASE_URL ? new PrismaPg({ connectionString: process.env.DATABASE_URL }) : undefined,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { reservationId, guestId } = body ?? {};

  if (!reservationId) {
    return NextResponse.json({ error: "Missing reservationId" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { digitalKey: true, guest: true },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  const digitalKey = reservation.digitalKey;
  const lockService = new LockService();
  const decision = await lockService.simulateUnlock({
    reservationId: reservation.id,
    reservationStatus: reservation.checkInStatus,
    digitalKey: digitalKey ? {
      status: digitalKey.status,
      validUntil: digitalKey.validUntil,
      reservationId: digitalKey.reservationId,
    } : null,
    guestAuthorized: !guestId || guestId === reservation.guestId,
  });

  if (decision.status === "success") {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.digitalKey.findUnique({ where: { reservationId: reservation.id } });
      if (current) {
        await tx.digitalKey.update({
          where: { id: current.id },
          data: {
            unlockCount: (current.unlockCount || 0) + 1,
            lastUnlockedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      await tx.unlockHistory.create({
        data: {
          reservationId: reservation.id,
          guestId: reservation.guestId,
          digitalKeyId: current?.id || null,
          lockId: current?.lockId || current?.lockDeviceId || null,
          result: "SUCCESS",
          reason: "authorized_unlock",
          unlockedAt: new Date(),
        },
      });

      return { status: "success", unlockCount: (current?.unlockCount || 0) + 1 };
    });

    return NextResponse.json({
      status: updated.status,
      message: decision.message,
      unlockCount: updated.unlockCount,
    });
  }

  if (decision.status === "expired") {
    await prisma.unlockHistory.create({
      data: {
        reservationId: reservation.id,
        guestId: reservation.guestId,
        digitalKeyId: digitalKey?.id || null,
        lockId: digitalKey?.lockId || digitalKey?.lockDeviceId || null,
        result: "EXPIRED",
        reason: "expired_key",
        unlockedAt: new Date(),
      },
    });
  }

  return NextResponse.json({
    status: decision.status,
    message: decision.message,
  });
}
