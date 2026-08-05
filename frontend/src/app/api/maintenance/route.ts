import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const rawTickets = await prisma.maintenanceTicket.findMany({
      orderBy: { reportTime: 'desc' },
    });

    const tickets = rawTickets.map((t) => ({
      ...t,
      images: JSON.parse(t.images || '[]'),
      completionImages: t.completionImages ? JSON.parse(t.completionImages) : [],
    }));

    return NextResponse.json({ success: true, data: tickets });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, category, title, description, priority, images } = body;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    const ticketNumber = `TKT-2026-${Math.floor(100 + Math.random() * 900)}`;

    // Database Transaction: Create ticket & update room status to MAINTENANCE_PENDING
    const [ticket] = await prisma.$transaction([
      prisma.maintenanceTicket.create({
        data: {
          ticketNumber,
          roomId,
          roomNumber: room.roomNumber,
          category,
          title,
          description,
          priority: priority || 'HIGH',
          status: 'OPEN',
          reporterName: 'Maria Rodriguez',
          reporterRole: 'HOUSEKEEPER',
          images: JSON.stringify(images || []),
          smsSentToTech: priority === 'HIGH' || priority === 'URGENT',
        },
      }),
      prisma.room.update({
        where: { id: roomId },
        data: { status: 'MAINTENANCE_PENDING', priority },
      }),
      prisma.notification.create({
        data: {
          title: `🚨 ${priority} Maintenance Ticket (DB API)`,
          message: `Room ${room.roomNumber}: ${category} - "${title}" logged in PostgreSQL/Prisma.`,
          type: 'MAINTENANCE_ALERT',
          roomId,
        },
      }),
    ]);

    const formattedTicket = {
      ...ticket,
      images: JSON.parse(ticket.images || '[]'),
    };

    return NextResponse.json({ success: true, data: formattedTicket }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
