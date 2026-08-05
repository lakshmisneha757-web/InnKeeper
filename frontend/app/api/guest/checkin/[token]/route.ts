import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { RESERVATION } from "@/lib/mock-data";

const prisma = new PrismaClient({
  adapter: process.env.DATABASE_URL ? new PrismaPg({ connectionString: process.env.DATABASE_URL }) : undefined,
});

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  if (!params.token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const reservation = await prisma.reservation.findFirst({
      where: { checkInToken: params.token },
      include: { guest: true },
    });

    if (!reservation) {
      return NextResponse.json({
        token: params.token,
        reservationId: "res_demo_1",
        ...RESERVATION,
      });
    }

    if (reservation.tokenExpiresAt && reservation.tokenExpiresAt < new Date()) {
      return NextResponse.json({ error: "expired" }, { status: 410 });
    }

    const nights = Math.max(1, Math.ceil((new Date(reservation.checkOutDate).getTime() - new Date(reservation.checkInDate).getTime()) / (1000 * 60 * 60 * 24)));

    return NextResponse.json({
      token: params.token,
      reservationId: reservation.id,
      guestName: reservation.guest?.fullName || "Guest",
      confirmationNumber: reservation.confirmationNumber,
      roomType: reservation.roomType,
      checkIn: new Date(reservation.checkInDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      checkOut: new Date(reservation.checkOutDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      guests: reservation.guestCount,
      nights,
      roomRate: Number(reservation.roomRate),
      taxes: Number(reservation.taxes),
      incidentalHold: Number(reservation.incidentalHold),
      hotelName: reservation.hotelName || "InnKeeper Hotel",
      roomNumber: reservation.roomNumber || "304",
      checkoutTime: new Date(reservation.checkOutDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      checkInStatus: reservation.checkInStatus,
    });
  } catch (error: any) {
    console.error("[guest/checkin] DB query failed", error);
    return NextResponse.json({
      token: params.token,
      reservationId: "res_demo_1",
      ...RESERVATION,
    });
  }
}
