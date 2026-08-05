import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function getRoomAvailability(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const [rooms, reservations] = await Promise.all([
      prisma.room.findMany({ include: { room_type: true } }),
      prisma.reservation.findMany({
        where: {
          AND: [
            { checkIn: { lte: end } },
            { checkOut: { gte: start } },
            { status: { not: 'cancelled' } }
          ]
        }
      })
    ]);

    // Build a date range
    const days = [];
    const current = new Date(start);
    while (current <= end) {
      days.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }

    const availability = rooms.map(room => {
      const roomReservations = reservations.filter(r => r.roomId === room.id);
      const dailyStatus = days.map(day => {
        const isBooked = roomReservations.some(r => {
          const ci = new Date(r.checkIn).toISOString().slice(0, 10);
          const co = new Date(r.checkOut).toISOString().slice(0, 10);
          return day >= ci && day < co;
        });
        return { date: day, available: !isBooked };
      });
      return {
        roomId: room.id,
        roomNumber: room.room_number,
        roomType: room.room_type?.name || 'Standard',
        rate: room.current_price,
        dailyStatus
      };
    });

    res.json({ rooms: availability, days });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
