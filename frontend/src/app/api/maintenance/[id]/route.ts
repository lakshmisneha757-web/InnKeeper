import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id;
    const body = await request.json();
    const { action, estimatedTime, notes, completionImages, finalRoomStatus, techName } = body;

    const existingTicket = await prisma.maintenanceTicket.findUnique({ where: { id: ticketId } });
    if (!existingTicket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    if (action === 'ACCEPT') {
      const updated = await prisma.maintenanceTicket.update({
        where: { id: ticketId },
        data: {
          status: 'ASSIGNED',
          assignedTechId: 'tech-1',
          assignedTechName: techName || 'Alex Rivera (Plumbing Specialist)',
        },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'REJECT') {
      const updated = await prisma.maintenanceTicket.update({
        where: { id: ticketId },
        data: { status: 'REJECTED' },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'START') {
      const updated = await prisma.maintenanceTicket.update({
        where: { id: ticketId },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          estimatedCompletionTime: estimatedTime || '1 Hour',
        },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'PAUSE') {
      const updated = await prisma.maintenanceTicket.update({
        where: { id: ticketId },
        data: { status: 'PAUSED' },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'COMPLETE') {
      const now = new Date();
      const targetRoomStatus = finalRoomStatus || 'DIRTY';

      const [ticket] = await prisma.$transaction([
        prisma.maintenanceTicket.update({
          where: { id: ticketId },
          data: {
            status: 'RESOLVED',
            completedAt: now,
            repairNotes: notes || 'Repair completed.',
            completionImages: JSON.stringify(completionImages || []),
          },
        }),
        prisma.room.update({
          where: { id: existingTicket.roomId },
          data: { status: targetRoomStatus },
        }),
        prisma.notification.create({
          data: {
            title: '🔧 Maintenance Repair Completed (DB API)',
            message: `Ticket #${existingTicket.ticketNumber} for Room ${existingTicket.roomNumber} resolved in DB. Room status -> ${targetRoomStatus}.`,
            type: 'MAINTENANCE_ALERT',
            roomId: existingTicket.roomId,
            ticketId: existingTicket.id,
          },
        }),
      ]);

      return NextResponse.json({ success: true, data: ticket });
    }

    return NextResponse.json({ success: false, error: 'Invalid action parameter' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
