import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function getDashboard(req, res) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [rooms, reservations, guests, payments, notifications, totalRevenueAggr, todayRevenueAggr] = await Promise.all([
      prisma.room.findMany({ include: { room_type: true } }),
      prisma.reservation.findMany({ include: { guest: true }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.guest.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.payment.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.appNotification.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { createdAt: { gte: today } }, _sum: { amount: true } })
    ]);

    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => !r.availability).length;
    const availableRooms = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const todayRevenue = todayRevenueAggr._sum.amount || 0;
    const totalRevenue = totalRevenueAggr._sum.amount || 0;

    const arrivalsToday = reservations.filter(r => {
      const ci = new Date(r.checkIn);
      return ci >= today && ci < tomorrow;
    }).length;

    const departuresToday = reservations.filter(r => {
      const co = new Date(r.checkOut);
      return co >= today && co < tomorrow;
    }).length;

    res.json({
      totalRooms,
      occupiedRooms,
      availableRooms,
      occupancyRate,
      totalRevenue,
      todayRevenue,
      totalGuests: guests.length,
      activeReservations: reservations.filter(r => ['confirmed', 'checked_in'].includes(r.status)).length,
      arrivalsToday,
      departuresToday,
      recentReservations: reservations.slice(0, 5),
      recentPayments: payments.slice(0, 5),
      recentNotifications: notifications.slice(0, 5),
      rooms: rooms.map(r => ({
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
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
