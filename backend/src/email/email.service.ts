import { Injectable, Logger } from '@nestjs/common';
import crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export type CheckInEmailPayload = {
  reservationId: string;
  guestName: string;
  guestEmail: string;
  hotelName: string;
  confirmationNumber: string;
  roomType: string;
  checkInDate: Date;
  token: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sendReservationCheckInEmail(payload: CheckInEmailPayload) {
    const { reservationId, guestName, guestEmail, hotelName, confirmationNumber, roomType, checkInDate, token } = payload;

    const subject = `Your contactless check-in is ready for reservation ${confirmationNumber}`;
    const checkInLink = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/checkin/${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height:1.6; color:#111827;">
        <h2 style="margin-bottom:12px;">Welcome, ${guestName}</h2>
        <p>Your contactless check-in is ready.</p>
        <p><strong>Reservation:</strong> ${confirmationNumber}</p>
        <p><strong>Hotel:</strong> ${hotelName}</p>
        <p><strong>Check-in Date:</strong> ${new Date(checkInDate).toLocaleString()}</p>
        <p><strong>Room Type:</strong> ${roomType}</p>
        <p><strong>Secure Check-in Link:</strong></p>
        <p><a href="${checkInLink}">${checkInLink}</a></p>
      </div>
    `;

    const startedAt = new Date();

    try {
      const emailLog = await (this.prisma as any).emailLog.create({
        data: {
          reservationId,
          recipient: guestEmail,
          subject,
          status: 'PENDING',
          retryCount: 0,
        },
      });

      const provider = (process.env.EMAIL_PROVIDER || 'mock').toLowerCase();

      if (provider === 'smtp') {
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
          throw new Error('SMTP email is not configured');
        }
      }

      if (provider === 'mock' || provider === 'console') {
        this.logger.log(`Mock email sent to ${guestEmail} for reservation ${reservationId}`);
      }

      await (this.prisma as any).emailLog.update({
        where: { emailId: emailLog.emailId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          retryCount: emailLog.retryCount || 0,
          errorMessage: null,
        },
      });

      await (this.prisma as any).reservation.update({
        where: { id: reservationId },
        data: {
          emailSent: true,
          emailSentAt: startedAt,
          emailStatus: 'SENT',
          emailRetryCount: 0,
          emailLastError: null,
        },
      });

      return {
        success: true,
        sentAt: startedAt,
        provider,
        link: checkInLink,
        emailId: emailLog.emailId,
        subject,
        html,
      };
    } catch (error: any) {
      this.logger.error(`Email sending failed for reservation ${reservationId}`, error);

      try {
        const emailLog = await (this.prisma as any).emailLog.create({
          data: {
            reservationId,
            recipient: guestEmail,
            subject,
            status: 'FAILED',
            retryCount: 1,
            errorMessage: error?.message || 'Unknown email failure',
          },
        });

        await (this.prisma as any).reservation.update({
          where: { id: reservationId },
          data: {
            emailSent: false,
            emailStatus: 'FAILED',
            emailLastError: error?.message || 'Unknown email failure',
            emailRetryCount: { increment: 1 },
          },
        });

        return {
          success: false,
          sentAt: startedAt,
          emailId: emailLog.emailId,
          error: error?.message || 'Unknown email failure',
        };
      } catch {
        return {
          success: false,
          sentAt: startedAt,
          error: error?.message || 'Unknown email failure',
        };
      }
    }
  }

  async scheduleRetry(reservationId: string, errorMessage?: string) {
    const reservation = await (this.prisma as any).reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) return false;

    const retryCount = Number(reservation.emailRetryCount || 0) + 1;
    await (this.prisma as any).reservation.update({
      where: { id: reservationId },
      data: {
        emailStatus: 'PENDING',
        emailRetryCount: retryCount,
        emailLastError: errorMessage || null,
      },
    });

    return true;
  }

  generateSecureToken() {
    return crypto.randomBytes(24).toString('hex');
  }
}
