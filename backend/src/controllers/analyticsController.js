import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function getAnalytics(req, res) {
  try {
    const [rooms, reservations, payments, guests] = await Promise.all([
      prisma.room.findMany({ include: { room_type: true } }),
      prisma.reservation.findMany(),
      prisma.payment.findMany(),
      prisma.guest.findMany(),
    ]);

    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => !r.availability).length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const totalRevenue = payments
      .filter(p => p.paymentStatus === 'Completed' || p.paymentStatus === 'Paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const revenueByMonth = {};
    payments.forEach(p => {
      const month = new Date(p.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      revenueByMonth[month] = (revenueByMonth[month] || 0) + (p.amount || 0);
    });

    const roomTypeBreakdown = {};
    rooms.forEach(r => {
      const type = r.room_type?.name || 'Unknown';
      roomTypeBreakdown[type] = (roomTypeBreakdown[type] || 0) + 1;
    });

    const activeReservations = reservations.filter(r => ['confirmed', 'checked_in'].includes(r.status)).length;

    res.json({
      totalRooms,
      occupiedRooms,
      availableRooms: totalRooms - occupiedRooms,
      occupancyRate,
      totalRevenue,
      totalGuests: guests.length,
      activeReservations,
      revenueByMonth: Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue })),
      roomTypeBreakdown: Object.entries(roomTypeBreakdown).map(([type, count]) => ({ type, count })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
