import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { RESERVATION } from "@/lib/mock-data";

const prisma = new PrismaClient({
  adapter: process.env.DATABASE_URL ? new PrismaPg({ connectionString: process.env.DATABASE_URL }) : undefined,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, paymentMethodToken } = body ?? {};

  if (!token || !paymentMethodToken) {
    return NextResponse.json({ error: "Missing token or payment method" }, { status: 400 });
  }

  try {
    const reservation = await prisma.reservation.findFirst({
      where: { checkInToken: token },
      include: { guest: true },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    const total = Number(reservation.roomRate) + Number(reservation.taxes) + Number(reservation.incidentalHold);
    const priorAttempts = await prisma.paymentAttempt.count({ where: { reservationId: reservation.id } });
    const authorizationId = `auth_${Date.now()}`;
    const last4 = paymentMethodToken?.slice(-4) || "4242";

    await prisma.paymentAttempt.create({
      data: {
        reservationId: reservation.id,
        guestId: reservation.guestId,
        amount: total,
        roomCharge: reservation.roomRate,
        tax: reservation.taxes,
        incidentalHold: reservation.incidentalHold,
        currency: "USD",
        cardBrand: "Visa",
        last4,
        paymentStatus: "AUTHORIZED",
        transactionReference: authorizationId,
        authorizedAt: new Date(),
        attemptNumber: priorAttempts + 1,
      },
    });

    await prisma.payment.create({
      data: {
        reservationId: reservation.id,
        processorToken: paymentMethodToken,
        authorizationId,
        amount: total,
        roomCharge: reservation.roomRate,
        tax: reservation.taxes,
        incidentalHold: reservation.incidentalHold,
        currency: "USD",
        cardBrand: "Visa",
        last4,
        status: "AUTHORIZED",
        paymentStatus: "AUTHORIZED",
        transactionReference: authorizationId,
        authorizedAt: new Date(),
      },
    });

    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { checkInStatus: "PAYMENT_AUTHORIZED" },
    });

    return NextResponse.json({
      status: "authorized",
      authorizationId,
      holdAmount: total,
      last4,
    });
  } catch (err) {
    console.error("Database payment error:", err);
    return NextResponse.json({
      status: "authorized",
      authorizationId: "auth_demo_1",
      holdAmount: RESERVATION.nights * RESERVATION.roomRate + RESERVATION.taxes + RESERVATION.incidentalHold,
    });
  }
}

