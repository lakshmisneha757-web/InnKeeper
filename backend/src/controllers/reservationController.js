import { prisma } from '../utils/db.js';
import { sendCheckInEmail } from '../utils/emailNotifier.js';

function paginate(data, page, limit) {
  const total = data.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return { items: data.slice(start, start + limit), total, page, limit, pages };
}

export async function listReservations(req, res) {
  try {
    const { page = 1, limit = 50, q = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const whereClause = q ? {
      OR: [
        { guest: { firstName: { contains: q, mode: 'insensitive' } } },
        { guest: { lastName: { contains: q, mode: 'insensitive' } } },
        { status: { contains: q, mode: 'insensitive' } }
      ]
    } : {};

    const [total, reservations] = await Promise.all([
      prisma.reservation.count({ where: whereClause }),
      prisma.reservation.findMany({
        where: whereClause,
        include: { guest: true, room: true },
        orderBy: { id: 'desc' },
        skip,
        take
      })
    ]);

    const pages = Math.ceil(total / take);

    const mapped = reservations.map(r => ({
      ...r,
      roomNumber: r.room ? String(r.room.room_number) : (r.roomId ? String(r.roomId) : "—"),
      room: r.room ? { id: r.room.id, room_number: r.room.room_number, number: r.room.room_number, floor: r.room.floor } : null
    }));

    res.json({ items: mapped, total, page: Number(page), limit: take, pages });
  } catch (err) {
    res.status(500).json({ error: 'An internal error occurred while processing your request.' });
  }
}

export async function createReservation(req, res) {
  try {
    const { 
      checkIn, 
      checkOut, 
      guestId, 
      roomId, 
      firstName, 
      lastName, 
      email, 
      phone, 
      status, 
      totalCharges, 
      paidAmount, 
      source, 
      notes 
    } = req.body;

    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'Check-in and Check-out dates are required.' });
    }
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({ error: 'Provided check-in or check-out date is invalid.' });
    }

    let targetRoomId = null;
    if (roomId) {
      let room = await prisma.room.findUnique({ where: { id: Number(roomId) } });
      if (!room) {
        room = await prisma.room.findFirst({ where: { room_number: String(roomId) } });
      }
      if (room) {
        targetRoomId = room.id;
        const st = String(room.status || '').toLowerCase();
        let reason = null;
        if (st === 'dirty') reason = 'dirty';
        else if (st === 'maintenance' || st === 'under_maintenance' || st === 'out_of_service') reason = 'under maintenance';
        else if (st === 'occupied') reason = 'occupied';
        else if (room.availability === false) reason = 'unavailable';

        if (reason) {
          return res.status(400).json({
            error: `Room ${room.room_number || room.id} is ${reason} and cannot be reserved for a new booking.`
          });
        }
      } else {
        targetRoomId = Number(roomId);
      }
    }

    if (firstName || lastName) {
      const fn = String(firstName || '').trim();
      const ln = String(lastName || '').trim();
      if (!fn || fn.length < 2 || !/^[A-Za-z\s'\-]+$/.test(fn)) {
        return res.status(400).json({ error: 'First Name must contain at least 2 alphabetic characters.' });
      }
      if (!ln || !/^[A-Za-z\s'\-]+$/.test(ln)) {
        return res.status(400).json({ error: 'Last Name must contain only alphabetic characters.' });
      }
    }

    if (email) {
      const em = String(email).trim();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
      const parts = em.split('@');
      if (!emailRegex.test(em) || parts.length !== 2 || parts[1].startsWith('.') || parts[1].endsWith('.') || parts[1].includes('..')) {
        return res.status(400).json({ error: 'Please provide a valid email address (e.g. guest@example.com).' });
      }
    }

    if (phone) {
  const phoneNumber = String(phone).trim();
  const cleanPhone = phoneNumber.replace(/\D/g, '');

  const internationalPhoneRegex = /^\+?[1-9]\d{9,14}$/;

  if (
    !internationalPhoneRegex.test(phoneNumber) ||
    /^(\d)\1+$/.test(cleanPhone) ||
    cleanPhone === '1234567890'
  ) {
    return res.status(400).json({
      error: 'Please provide a valid international phone number.'
    });
  }
}

    let finalGuestId = guestId ? Number(guestId) : null;

    // If guest details (firstName/lastName) are provided for a new reservation, always create a fresh guest record
    if (firstName && lastName) {
      const newGuest = await prisma.guest.create({
        data: {
          firstName: String(firstName).trim(),
          lastName: String(lastName).trim(),
          email: email ? String(email).trim() : null,
          phone: phone ? String(phone).trim() : null,
        }
      });
      finalGuestId = newGuest.id;
    } else if (guestId) {
      finalGuestId = Number(guestId);
    }

    let calculatedTotal = totalCharges !== undefined && Number(totalCharges) > 0 ? Number(totalCharges) : 0;
    if ((!calculatedTotal || calculatedTotal === 0) && targetRoomId) {
      const targetRoomObj = await prisma.room.findUnique({ where: { id: targetRoomId } });
      if (targetRoomObj && targetRoomObj.current_price) {
        const diffMs = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
        const nights = Math.max(1, Math.ceil(diffMs / (1000 * 3600 * 24)) || 1);
        calculatedTotal = nights * targetRoomObj.current_price;
      }
    }

    const reservation = await prisma.reservation.create({
      data: {
        guestId: finalGuestId,
        roomId: targetRoomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status: status || 'confirmed',
        totalCharges: calculatedTotal,
        paidAmount: paidAmount !== undefined ? Number(paidAmount) : calculatedTotal,
        source: source || 'Direct',
        notes: notes || '',
      },
      include: { guest: true }
    });

    const isCheckedInStatus = (status || '').toLowerCase().includes('check');
    if (isCheckedInStatus && Number(paidAmount) > 0) {
      const gName = reservation.guest ? `${reservation.guest.firstName} ${reservation.guest.lastName}`.trim() : 'Guest';
      await prisma.payment.create({
        data: {
          reservationId: reservation.id,
          amount: Number(paidAmount),
          method: req.body.paymentMethod || 'Credit Card',
          paymentStatus: 'Paid',
          notes: `Payment collected at check-in for ${gName} (Reservation #${reservation.id})`,
        }
      });
    }

    const { vehiclePlate, vehicleMake, vehicleModel } = req.body;
    if (vehiclePlate && String(vehiclePlate).trim()) {
      const cleanPlate = String(vehiclePlate).trim().toUpperCase();
      const norm = (s) => String(s || '').replace(/\s+/g, '').toUpperCase();
      const allVehicles = await prisma.vehicle.findMany();
      const existingVeh = allVehicles.find(v => norm(v.licensePlate) === norm(cleanPlate));
      if (!existingVeh) {
        try {
          await prisma.vehicle.create({
            data: {
              licensePlate: cleanPlate,
              make: vehicleMake ? String(vehicleMake).trim() : 'Guest Vehicle',
              model: vehicleModel ? String(vehicleModel).trim() : '',
              state: 'NA',
              parkingSlot: roomId ? `Slot #${(Number(roomId) % 20) + 1}` : 'Slot A-1'
            }
          });
        } catch (vehErr) {
          console.log('Vehicle record auto-creation note:', vehErr.message);
        }
      }
    }

    if (reservation.guest?.email) {
      try {
        await sendCheckInEmail({
          guestEmail: reservation.guest.email,
          guestName: `${reservation.guest.firstName} ${reservation.guest.lastName}`,
          reservationId: reservation.id,
          roomId: reservation.roomId,
          checkInDate: reservation.checkIn
        });
      } catch (e) {
        console.error('CheckIn email failed to send:', e.message);
      }
    }

    res.status(201).json(reservation);
  } catch (err) {
    console.error('createReservation error:', err);
    res.status(500).json({ error: 'An internal error occurred while processing your request.' });
  }
}

export async function updateReservation(req, res) {
  try {
    const { checkIn, checkOut, firstName, lastName, email, phone, guestId, roomId } = req.body;
    const ALLOWED_RESERVATION_FIELDS = ['status', 'totalCharges', 'paidAmount', 'source', 'notes'];
    const updateData = {};

    for (const field of ALLOWED_RESERVATION_FIELDS) {
      if (field in req.body) {
        updateData[field] = req.body[field];
      }
    }

    if (checkIn !== undefined) {
      const parsed = new Date(checkIn);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'Invalid check-in date' });
      }
      updateData.checkIn = parsed;
    }
    if (checkOut !== undefined) {
      const parsed = new Date(checkOut);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'Invalid check-out date' });
      }
      updateData.checkOut = parsed;
    }

    if (roomId !== undefined) {
      updateData.roomId = roomId ? Number(roomId) : null;
    }

    if (guestId !== undefined) {
      updateData.guestId = guestId ? Number(guestId) : null;
    }

    const currentRes = await prisma.reservation.findUnique({ where: { id: Number(req.params.id) } });

    // Handle guest updates if guest names/email are passed
    if (currentRes?.guestId && (firstName || lastName || email || phone)) {
      await prisma.guest.update({
        where: { id: currentRes.guestId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(email !== undefined && { email }),
          ...(phone !== undefined && { phone }),
        }
      });
    }

    if (updateData.status === 'checked_out') {
      updateData.digitalKeyStatus = 'EXPIRED';
    }

    const reservation = await prisma.reservation.update({
      where: { id: Number(req.params.id) },
      data: updateData,
      include: { guest: true }
    });

    if (updateData.status === 'checked_out' && reservation.roomId) {
      try {
        await prisma.room.update({
          where: { id: reservation.roomId },
          data: { status: 'dirty', availability: true }
        });
      } catch (rErr) {
        console.log('Room checkout status update note:', rErr.message);
      }
    } else if (updateData.status === 'checked_in' && reservation.roomId) {
      try {
        await prisma.room.update({
          where: { id: reservation.roomId },
          data: { status: 'occupied', availability: false }
        });
      } catch (rErr) {
        console.log('Room checkin status update note:', rErr.message);
      }
    }

    const isCheckedIn = (reservation.status || '').toLowerCase().includes('check');
    if (isCheckedIn && updateData.paidAmount !== undefined && Number(updateData.paidAmount) > 0) {
      const existingPay = await prisma.payment.findFirst({ where: { reservationId: reservation.id } });
      const gName = reservation.guest ? `${reservation.guest.firstName} ${reservation.guest.lastName}`.trim() : 'Guest';
      if (existingPay) {
        await prisma.payment.update({
          where: { id: existingPay.id },
          data: {
            amount: Number(updateData.paidAmount),
            paymentStatus: 'Paid',
          }
        });
      } else {
        await prisma.payment.create({
          data: {
            reservationId: reservation.id,
            amount: Number(updateData.paidAmount),
            method: 'Credit Card',
            paymentStatus: 'Paid',
            notes: `Payment collected at check-in for ${gName} (Reservation #${reservation.id})`,
          }
        });
      }
    }

    res.json(reservation);
  } catch (err) {
    console.error('updateReservation error:', err);
    res.status(500).json({ error: 'An internal error occurred while processing your request.' });
  }
}

export async function deleteReservation(req, res) {
  try {
    await prisma.reservation.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'An internal error occurred while processing your request.' });
  }
}
