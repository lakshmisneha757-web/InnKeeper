import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id;
    const body = await request.json().catch(() => ({}));
    const endTime = new Date();

    const existingRoom = await prisma.room.findUnique({ where: { id: roomId } });
    if (!existingRoom) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    const startTime = existingRoom.cleaningStartTime
      ? new Date(existingRoom.cleaningStartTime)
      : new Date(Date.now() - 25 * 60 * 1000);

    const durationMinutes = Math.max(
      1,
      Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
    );

    const room = await prisma.room.update({
      where: { id: roomId },
      data: {
        status: 'CLEAN',
        cleaningEndTime: endTime,
        cleaningDurationMinutes: durationMinutes,
        cleaningNotes: body.notes || existingRoom.cleaningNotes,
        lastCleanedAt: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    });

    // DB Notification log
    await prisma.notification.create({
      data: {
        title: '✨ Room Cleaned (DB API)',
        message: `Room ${room.roomNumber} marked CLEAN in DB. Duration: ${durationMinutes} mins.`,
        type: 'HOUSEKEEPING_ALERT',
        roomId: room.id,
      },
    });

    return NextResponse.json({ success: true, data: room });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
