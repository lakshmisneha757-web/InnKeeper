/**
 * src/scheduler/scheduler.standalone.ts
 *
 * Runs inside Next.js via instrumentation.ts and handles the email-only
 * check-in reminder flow without any SMS dependency.
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { EmailService } from '../email/email.service';

const prisma = new PrismaClient({
  adapter: process.env.DATABASE_URL ? new PrismaPg({ connectionString: process.env.DATABASE_URL }) : undefined,
});

const emailService = new EmailService(prisma as any);

async function runCheckInEmailJob() {
  console.log('[Scheduler] Running check-in email scheduler...');

  try {
    const now = new Date();
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const reservations = await prisma.reservation.findMany({
      where: {
        emailSent: false,
        emailStatus: { not: 'SENT' },
        checkInDate: {
          gte: now,
          lte: threeHoursFromNow,
        },
      },
      include: {
        guest: true,
      },
    });

    console.log(`[Scheduler] Found ${reservations.length} reservations for email`);

    for (const reservation of reservations) {
      try {
        let token = reservation.checkInToken;
        if (!token) {
          token = emailService.generateSecureToken();
          await prisma.reservation.update({
            where: { id: reservation.id },
            data: {
              checkInToken: token,
              tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          });
        }

        const result = await emailService.sendReservationCheckInEmail({
          reservationId: reservation.id,
          guestName: reservation.guest?.fullName || 'Guest',
          guestEmail: reservation.guest?.email || reservation.guest?.phone || 'unknown@example.com',
          hotelName: reservation.hotelName || 'InnKeeper Hotel',
          confirmationNumber: reservation.confirmationNumber,
          roomType: reservation.roomType,
          checkInDate: reservation.checkInDate,
          token,
        });

        if (!result?.success) {
          await emailService.scheduleRetry(reservation.id, result?.error || 'email failed');
        }
      } catch (error) {
        console.error(`[Scheduler] Email failed for reservation ${reservation.id}`, error);
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error', error);
  }
}

export async function startScheduler() {
  console.log('[Scheduler] Started');
  await runCheckInEmailJob();
  setInterval(runCheckInEmailJob, 60_000);
}
