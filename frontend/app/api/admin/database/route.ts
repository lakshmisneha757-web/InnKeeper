import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: process.env.DATABASE_URL ? new PrismaPg({ connectionString: process.env.DATABASE_URL }) : undefined,
});

export async function GET() {
  try {
    const [guests, reservations, verifications, payments, keys] = await Promise.all([
      prisma.guest.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.reservation.findMany({
        include: { guest: true, identityVerification: true, payment: true, digitalKey: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.identityVerification.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.payment.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.digitalKey.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    return NextResponse.json({
      guests,
      reservations,
      verifications,
      payments,
      keys,
      databaseName: "innkeeper",
      provider: "PostgreSQL 17",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Database query failed" }, { status: 500 });
  }
}
