import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id;
    const now = new Date();

    const room = await prisma.room.update({
      where: { id: roomId },
      data: {
        status: 'CLEANING_IN_PROGRESS',
        cleaningStartTime: now,
        cleaningEndTime: null,
      },
    });

    await prisma.notification.create({
      data: {
        title: 'Cleaning Started (DB API)',
        message: `Room ${room.roomNumber} cleaning started at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        type: 'HOUSEKEEPING_ALERT',
        roomId: room.id,
      },
    });

    return NextResponse.json({ success: true, data: room });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
