import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: process.env.DATABASE_URL ? new PrismaPg({ connectionString: process.env.DATABASE_URL }) : undefined,
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const reservationId = params.id;
  if (!reservationId) {
    return NextResponse.json({ error: "Missing reservation id" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { guest: true, identityVerification: true, payment: true, digitalKey: true },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...reservation,
    roomRate: Number(reservation.roomRate),
    taxes: Number(reservation.taxes),
    incidentalHold: Number(reservation.incidentalHold),
    payment: reservation.payment ? { ...reservation.payment, amount: Number(reservation.payment.amount) } : null,
    digitalKey: reservation.digitalKey ? { ...reservation.digitalKey } : null,
  });
}
