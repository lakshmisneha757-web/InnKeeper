import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit() {
    this.logger.log('Scheduler Started');
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAutomatedCheckInEmail() {
    this.logger.log('Running check-in email scheduler...');

    const now = new Date();
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    try {
      const eligibleReservations = await (this.prisma as any).reservation.findMany({
        where: {
          emailSent: false,
          emailStatus: { not: 'SENT' },
          checkInDate: {
            gte: now,
            lte: threeHoursFromNow,
          },
        },
        include: { guest: true },
      });

      this.logger.log(`Found ${eligibleReservations.length} reservations for email`);

      for (const reservation of eligibleReservations) {
        try {
          let token = reservation.checkInToken;
          if (!token) {
            token = this.emailService.generateSecureToken();
            await (this.prisma as any).reservation.update({
              where: { id: reservation.id },
              data: {
                checkInToken: token,
                tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
              },
            });
          }

          const emailResult = await this.emailService.sendReservationCheckInEmail({
            reservationId: reservation.id,
            guestName: reservation.guest?.fullName || 'Guest',
            guestEmail: reservation.guest?.email || reservation.guest?.phone || 'unknown@example.com',
            hotelName: reservation.hotelName || 'InnKeeper Hotel',
            confirmationNumber: reservation.confirmationNumber,
            roomType: reservation.roomType,
            checkInDate: reservation.checkInDate,
            token,
          });

          if (!emailResult?.success) {
            this.logger.warn(`Email failed for reservation ${reservation.id}: ${emailResult?.error || 'unknown'}`);
            await this.emailService.scheduleRetry(reservation.id, emailResult?.error || 'unknown');
          }
        } catch (error) {
          this.logger.error(`Email processing failed for reservation ${reservation.id}`, error);
        }
      }
    } catch (error) {
      this.logger.error('Email scheduler error', error);
    }
  }
}
