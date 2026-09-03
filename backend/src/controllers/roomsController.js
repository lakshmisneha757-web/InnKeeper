import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function paginate(data, page, limit) {
  const total = data.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return { items: data.slice(start, start + limit), total, page, limit, pages };
}

export async function listRoomsNew(req, res) {
  try {
    const { page = 1, limit = 200, q = '' } = req.query;
    const rooms = await prisma.room.findMany({
      include: { room_type: true, channelInventory: true },
    });

    rooms.sort((a, b) => (parseInt(a.room_number, 10) || 0) - (parseInt(b.room_number, 10) || 0));
    const filtered = q
      ? rooms.filter(r => r.room_number.includes(q) || r.room_type?.name?.toLowerCase().includes(q.toLowerCase()))
      : rooms;
    const normalized = filtered.map(r => ({
      id: r.id,
      number: r.room_number,
      name: `Room ${r.room_number}`,
      type: r.room_type?.name?.toLowerCase() || 'standard',
      floor: r.floor,
      status: r.status?.toLowerCase() || 'vacant',
      rate: r.current_price,
      capacity: r.room_type?.capacity || 2,
      amenities: r.room_type?.description || null,
      isAvailable: r.availability ? 1 : 0,
      createdAt: r.last_updated,
      updatedAt: r.last_updated,
    }));
    res.json(paginate(normalized, Number(page), Number(limit)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function getRoomNew(req, res) {
  try {
    const room = await prisma.room.findUnique({
      where: { id: Number(req.params.id) },
      include: { room_type: true }
    });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ ...room, number: room.room_number, type: room.room_type?.name?.toLowerCase() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createRoomNew(req, res) {
  try {
    const { number, type, floor, status, rate, capacity } = req.body;
    // Find or create room_type
    let roomType = await prisma.roomType.findFirst({ where: { name: { contains: type, mode: 'insensitive' } } });
    if (!roomType) {
      roomType = await prisma.roomType.create({ data: { name: type || 'Standard', base_price: rate || 100, capacity: capacity || 2, description: '' } });
    }
    const room = await prisma.room.create({
      data: { room_number: number, room_type_id: roomType.id, floor: floor || 1, status: status || 'Vacant', current_price: rate || roomType.base_price, availability: true }
    });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateRoomNew(req, res) {
  try {
    const { status, rate, isAvailable, floor } = req.body;
    const roomId = Number(req.params.id);
    const room = await prisma.room.update({
      where: { id: roomId },
      data: {
        ...(status && { status }),
        ...(rate !== undefined && { current_price: rate }),
        ...(isAvailable !== undefined && { availability: Boolean(isAvailable) }),
        ...(floor !== undefined && { floor }),
        last_updated: new Date()
      }
    });

    if (status) {
      const st = String(status).toLowerCase();
      if (st === 'dirty' || st === 'vacant' || st === 'clean' || st === 'maintenance' || st === 'under_maintenance' || st === 'out_of_service') {
        const activeRes = await prisma.reservation.findMany({
          where: {
            roomId: roomId,
            status: { in: ['checked_in', 'CHECKED_IN'] }
          }
        });
        for (const r of activeRes) {
          await prisma.reservation.update({
            where: { id: r.id },
            data: { status: 'checked_out', digitalKeyStatus: 'EXPIRED' }
          });
        }
      } else if (st === 'occupied') {
        const confirmedRes = await prisma.reservation.findMany({
          where: {
            roomId: roomId,
            status: { in: ['confirmed', 'CONFIRMED'] }
          }
        });
        for (const r of confirmedRes) {
          if (r.verificationStatus === 'VERIFIED') {
            await prisma.reservation.update({
              where: { id: r.id },
              data: { status: 'checked_in' }
            });
          }
        }
      }
    }

    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteRoomNew(req, res) {
  try {
    await prisma.room.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
