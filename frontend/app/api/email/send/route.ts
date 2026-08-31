import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { EmailService } from "@/src/email/email.service";

const prisma = new PrismaClient({
  adapter: process.env.DATABASE_URL ? new PrismaPg({ connectionString: process.env.DATABASE_URL }) : undefined,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { reservationId, guestName, guestEmail, hotelName, confirmationNumber, roomType, checkInDate, token } = body ?? {};

  if (!reservationId || !guestEmail || !token) {
    return NextResponse.json({ error: "Missing required email fields" }, { status: 400 });
  }

  const emailService = new EmailService(prisma as any);
  const result = await emailService.sendReservationCheckInEmail({
    reservationId,
    guestName: guestName || "Guest",
    guestEmail,
    hotelName: hotelName || "InnKeeper Hotel",
    confirmationNumber: confirmationNumber || "N/A",
    roomType: roomType || "Standard Room",
    checkInDate: new Date(checkInDate || Date.now()),
    token,
  });

  return NextResponse.json(result);
}
