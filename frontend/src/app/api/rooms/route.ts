import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const floor = searchParams.get('floor');
    const building = searchParams.get('building');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    const where: any = {};

    if (floor && floor !== 'ALL') where.floor = parseInt(floor, 10);
    if (building && building !== 'ALL') where.building = building;
    if (status && status !== 'ALL') where.status = status;
    if (priority && priority !== 'ALL') where.priority = priority;

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { roomNumber: { contains: q } },
        { roomType: { contains: q } },
        { housekeeperName: { contains: q } },
      ];
    }

    let rooms = await prisma.room.findMany({
      where,
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
    });

    // Auto-seed database if empty
    if (rooms.length === 0 && !floor && !status && !search) {
      await fetch(new URL('/api/seed', request.url).toString(), { method: 'POST' });
      rooms = await prisma.room.findMany({
        orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
      });
    }

    return NextResponse.json({
      success: true,
      data: rooms,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const room = await prisma.room.create({
      data: body,
    });

    return NextResponse.json({ success: true, data: room }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
