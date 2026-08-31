import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function resetAndCreateGuestPayments() {
  console.log('🧹 Removing all current payment records...');
  await prisma.payment.deleteMany({});
  console.log('✅ Payments table cleared.');

  console.log('🔍 Fetching all reservations & guests...');
  const reservations = await prisma.reservation.findMany({
    include: { guest: true },
    orderBy: { id: 'desc' }
  });

  console.log(`Found ${reservations.length} reservations.`);

  const paymentMethods = ['Credit Card', 'UPI', 'Cash', 'Debit Card'];

  for (let i = 0; i < reservations.length; i++) {
    const r = reservations[i];
    const guestName = r.guest ? `${r.guest.firstName} ${r.guest.lastName}`.trim() : 'Guest';

    // Amount paid at checkin
    const paidAmount = (r.paidAmount && r.paidAmount > 0)
      ? r.paidAmount
      : ((r.totalCharges && r.totalCharges > 0) ? r.totalCharges : 2500);

    // Update reservation paid amount if 0
    if (!r.paidAmount || r.paidAmount === 0) {
      await prisma.reservation.update({
        where: { id: r.id },
        data: { paidAmount: paidAmount }
      });
    }

    const method = paymentMethods[i % paymentMethods.length];

    const payment = await prisma.payment.create({
      data: {
        reservationId: r.id,
        amount: paidAmount,
        method: method,
        paymentStatus: 'Paid',
        notes: `Check-in payment collected for ${guestName} (Reservation #${r.id})`,
        createdAt: r.createdAt || new Date(),
      }
    });

    console.log(`+ Created Payment ID #${payment.id}: ₹${paidAmount} (${method}) for Guest "${guestName}" [Reservation #${r.id}]`);
  }

  const finalPayments = await prisma.payment.findMany({
    include: { reservation: { include: { guest: true } } }
  });

  console.log(`\n🎉 Success! Total payments in DB now: ${finalPayments.length}`);
}

resetAndCreateGuestPayments()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
