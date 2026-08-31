import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: process.env.DATABASE_URL ? new PrismaPg({ connectionString: process.env.DATABASE_URL }) : undefined,
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const guestId = params.id;
  if (!guestId) {
    return NextResponse.json({ error: "Missing guest id" }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: { reservations: true },
  });

  if (!guest) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  return NextResponse.json(guest);
}
