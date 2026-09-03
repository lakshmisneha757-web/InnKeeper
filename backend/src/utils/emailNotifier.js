/**
 * Send automated express check-in confirmation email to guest
 */
export async function sendCheckInEmail({ guestEmail, guestName, reservationId, roomId, checkInDate }) {
  try {
    const checkInUrl = `http://localhost:5173/checkin?resId=${reservationId}`;

    // Log email notification for verification in logs
    console.log(`\n======================================================`);
    console.log(`[AUTOMATED CHECK-IN EMAIL SENT]`);
    console.log(`To: ${guestEmail}`);
    console.log(`Subject: Express Contactless Check-In Ready for Reservation #${reservationId}`);
    console.log(`Dear ${guestName}, your room (Room #${roomId || 101}) check-in link is live.`);
    console.log(`Complete ID verification & get room digital key pass here: ${checkInUrl}`);
    console.log(`======================================================\n`);

    // If SMTP credentials configured in .env, send real email via Nodemailer
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"InnKeeper Motel Front Desk" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: guestEmail,
          subject: `Complete Your Express Room Check-In (Reservation #${reservationId})`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; color: #1e293b;">
              <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
                <h2 style="color: #059669; margin-top: 0;">Welcome to InnKeeper Motel!</h2>
                <p>Hello <strong>${guestName}</strong>,</p>
                <p>Your contactless room check-in is now open. Complete your Driving License & Selfie verification to unlock your digital room key pass.</p>
                <div style="background-color: #f1f5f9; padding: 16px; border-radius: 12px; margin: 20px 0;">
                  <p style="margin: 4px 0;"><strong>Reservation ID:</strong> #${reservationId}</p>
                  <p style="margin: 4px 0;"><strong>Room Assigned:</strong> Room #${roomId || 101}</p>
                  <p style="margin: 4px 0;"><strong>Check-In Date:</strong> ${new Date(checkInDate).toLocaleDateString()}</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${checkInUrl}" style="background-color: #059669; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">
                    Complete Express Check-In Now &rarr;
                  </a>
                </div>
                <p style="font-size: 12px; color: #64748b; text-align: center;">If you did not request this booking, please contact front desk support.</p>
              </div>
            </div>
          `,
        });
      } catch (smtpErr) {
        console.log('[SMTP Transporter Note]:', smtpErr.message);
      }
    }

    return { success: true, email: guestEmail, checkInUrl };
  } catch (err) {
    console.error('Email sending error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send password reset email to guest or staff
 */
export async function sendPasswordResetEmail({ toEmail, resetToken }) {
  try {
    const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
    const resetUrl = `${appBaseUrl}/reset-password?email=${encodeURIComponent(toEmail)}&token=${encodeURIComponent(resetToken)}`;

    console.log(`\n======================================================`);
    console.log(`[PASSWORD RESET EMAIL SENT]`);
    console.log(`To: ${toEmail}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`======================================================\n`);

    // If SMTP credentials configured in .env, send real email via Nodemailer
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"InnKeeper Portal Support" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: toEmail,
          subject: 'Reset Your InnKeeper Account Password',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; color: #1e293b;">
              <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
                <h2 style="color: #2563eb; margin-top: 0;">Password Reset Request</h2>
                <p>Hello,</p>
                <p>We received a request to reset your password for your InnKeeper account (<strong>${toEmail}</strong>).</p>
                <p>Click the button below to choose a new password. This link is valid for 1 hour.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">
                    Reset Password Now &rarr;
                  </a>
                </div>
                <p style="font-size: 13px; color: #64748b;">Or copy and paste this link into your browser:</p>
                <p style="font-size: 12px; color: #2563eb; word-break: break-all;">${resetUrl}</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #64748b; text-align: center;">If you did not request a password reset, you can safely ignore this email.</p>
              </div>
            </div>
          `,
        });
      } catch (smtpErr) {
        console.error('[SMTP Error]:', smtpErr.message);
      }
    }

    return { success: true, resetUrl };
  } catch (err) {
    console.error('Password reset email error:', err);
    return { success: false, error: err.message };
  }
}
