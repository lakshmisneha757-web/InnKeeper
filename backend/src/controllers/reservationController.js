import { PrismaClient } from '@prisma/client';
import { sendCheckInEmail } from '../utils/emailNotifier.js';

const prisma = new PrismaClient();

function paginate(data, page, limit) {
  const total = data.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return { items: data.slice(start, start + limit), total, page, limit, pages };
}

export async function listReservations(req, res) {
  try {
    const { page = 1, limit = 50, q = '' } = req.query;
    const reservations = await prisma.reservation.findMany({
      include: { guest: true },
      orderBy: { createdAt: 'desc' }
    });
    const filtered = q
      ? reservations.filter(r => `${r.guest?.firstName || ''} ${r.guest?.lastName || ''} ${r.status}`.toLowerCase().includes(q.toLowerCase()))
      : reservations;
    res.json(paginate(filtered, Number(page), Number(limit)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createReservation(req, res) {
  try {
    const { checkIn, checkOut, ...rest } = req.body;
    const reservation = await prisma.reservation.create({
      data: {
        ...rest,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
      },
      include: { guest: true }
    });

    if (reservation.guest?.email) {
      await sendCheckInEmail({
        guestEmail: reservation.guest.email,
        guestName: `${reservation.guest.firstName} ${reservation.guest.lastName}`,
        reservationId: reservation.id,
        roomId: reservation.roomId,
        checkInDate: reservation.checkIn
      });
    }

    res.status(201).json(reservation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateReservation(req, res) {
  try {
    const { checkIn, checkOut, ...rest } = req.body;
    const reservation = await prisma.reservation.update({
      where: { id: Number(req.params.id) },
      data: {
        ...rest,
        ...(checkIn && { checkIn: new Date(checkIn) }),
        ...(checkOut && { checkOut: new Date(checkOut) }),
      },
      include: { guest: true }
    });
    res.json(reservation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteReservation(req, res) {
  try {
    await prisma.reservation.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
