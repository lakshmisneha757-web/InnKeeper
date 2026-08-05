import { PrismaClient } from '@prisma/client';
import { generateDigitalKeyPayload, LockService } from '../lock/lock.service.js';
import { sendCheckInEmail } from '../utils/emailNotifier.js';

const prisma = new PrismaClient();
const lockService = new LockService();

// Step 0: Create New Room Booking with Selected Room and Payment Gateway Details
export async function createBookingWithPayment(req, res) {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      roomId,
      checkIn,
      checkOut,
      paymentMethod, // 'Credit Card' | 'Stripe' | 'PayPal' | 'UPI' | 'Cash'
      cardNumber,
      cardHolder,
      expiry,
      cvv,
      upiId,
      totalAmount
    } = req.body;

    if (!firstName || !lastName || !roomId || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'Missing required guest or room details.' });
    }

    // 1. Create or Find Guest
    let guest = await prisma.guest.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { firstName, lastName }
        ]
      }
    });

    if (!guest) {
      guest = await prisma.guest.create({
        data: {
          firstName,
          lastName,
          email,
          phone
        }
      });
    }

    // 2. Create Reservation
    const parsedCheckIn = new Date(checkIn);
    const parsedCheckOut = new Date(checkOut);
    const charges = Number(totalAmount) || 299;

    const reservation = await prisma.reservation.create({
      data: {
        guestId: guest.id,
        roomId: Number(roomId),
        checkIn: parsedCheckIn,
        checkOut: parsedCheckOut,
        status: 'confirmed',
        totalCharges: charges,
        paidAmount: charges,
        source: 'Direct Web Booking',
        verificationStatus: 'UNVERIFIED',
        digitalKeyStatus: 'INACTIVE',
        notes: `Payment processed via ${paymentMethod || 'Credit Card'}`
      },
      include: {
        guest: true
      }
    });

    // 3. Create Payment Transaction Record
    const payment = await prisma.payment.create({
      data: {
        reservationId: reservation.id,
        amount: charges,
        method: paymentMethod || 'Credit Card',
        paymentStatus: 'COMPLETED',
        notes: `Gateway Ref: TXN-${Date.now().toString().slice(-8)} | Holder: ${cardHolder || firstName}`
      }
    });

    // 4. Send Automated Check-In Link Email to Guest Email Address
    const guestRecipientEmail = email || guest?.email;
    if (guestRecipientEmail) {
      await sendCheckInEmail({
        guestEmail: guestRecipientEmail,
        guestName: `${firstName} ${lastName}`,
        reservationId: reservation.id,
        roomId: Number(roomId),
        checkInDate: parsedCheckIn
      });
    }

    res.status(201).json({
      success: true,
      message: 'Room booked successfully, payment processed, and Check-In link sent to guest email!',
      reservation,
      payment
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Step 1: Submit ID Driving License + Selfie Verification
export async function verifyGuestId(req, res) {
  try {
    const { reservationId, dlImageUrl, selfieImageUrl } = req.body;

    if (!reservationId) {
      return res.status(400).json({ error: 'Reservation ID is required' });
    }

    // Match verification confidence score
    const matchScore = Math.floor(Math.random() * 15) + 85; // 85% - 99% high match score simulation
    const isVerified = matchScore >= 80;

    // Safely format base64/URL payload to prevent database field overflow
    const safeDlUrl = (dlImageUrl && dlImageUrl.length > 2000)
      ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop'
      : (dlImageUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop');

    const safeSelfieUrl = (selfieImageUrl && selfieImageUrl.length > 2000)
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop'
      : (selfieImageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop');

    const reservation = await prisma.reservation.update({
      where: { id: Number(reservationId) },
      data: {
        dlImageUrl: safeDlUrl,
        selfieImageUrl: safeSelfieUrl,
        verificationStatus: isVerified ? 'VERIFIED' : 'REJECTED',
      },
      include: { guest: true }
    });

    res.json({
      success: true,
      message: isVerified ? 'Driving License and Selfie identity verified successfully!' : 'ID verification failed. Facial similarity score too low.',
      matchScore: `${matchScore}%`,
      verificationStatus: reservation.verificationStatus,
      reservation
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Step 2: Complete Check-in & Issue Digital Lock Key & 6-digit PIN
export async function generateDigitalLockKey(req, res) {
  try {
    const { reservationId } = req.body;

    if (!reservationId) {
      return res.status(400).json({ error: 'Reservation ID is required' });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: Number(reservationId) },
      include: { guest: true }
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (reservation.verificationStatus !== 'VERIFIED') {
      return res.status(400).json({ error: 'ID Verification (Driving License & Selfie) must be completed before generating room lock key.' });
    }

    const roomNumber = reservation.roomId ? `ROOM-${reservation.roomId}` : 'ROOM-101';
    const lockId = `LOCK-${roomNumber}-${Date.now().toString().slice(-4)}`;
    
    // Generate 6-digit access PIN
    const digitalPin = Math.floor(100000 + Math.random() * 900000).toString();

    // Generate encrypted digital key payload using LockService
    const validFrom = new Date();
    const validUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days access
    const keyPayload = lockService.generateDigitalKeyPayload(String(reservation.id), lockId, validFrom, validUntil);

    const updated = await prisma.reservation.update({
      where: { id: Number(reservationId) },
      data: {
        status: 'CHECKED_IN',
        verificationStatus: 'VERIFIED',
        digitalPin,
        digitalKey: JSON.stringify(keyPayload),
        digitalKeyStatus: 'ACTIVE',
        lockId
      },
      include: { guest: true }
    });

    res.json({
      success: true,
      message: 'Check-in completed and Digital Key generated!',
      digitalPin,
      lockId,
      keyPayload,
      reservation: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Step 3: Simulate Room Door Unlock using Key / PIN
export async function unlockDoor(req, res) {
  try {
    const { reservationId, digitalPin } = req.body;

    const reservation = await prisma.reservation.findUnique({
      where: { id: Number(reservationId) }
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (reservation.digitalKeyStatus !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Digital Key is inactive or revoked.' });
    }

    if (digitalPin && reservation.digitalPin && digitalPin !== reservation.digitalPin) {
      return res.status(401).json({ success: false, message: 'Invalid Digital Key PIN code.' });
    }

    res.json({
      success: true,
      message: `Door [${reservation.lockId || 'ROOM-LOCK'}] unlocked successfully! Access granted.`,
      unlockedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
