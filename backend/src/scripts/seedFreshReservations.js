import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedFresh() {
  console.log('Seeding fresh reserved persons...');

  // Create or get guests
  const guest1 = await prisma.guest.create({
    data: {
      firstName: 'Gorla',
      lastName: 'Vijayalakshmi',
      email: 'vijayalakshmi@example.com',
      phone: '+91 9876543210',
    }
  });

  const guest2 = await prisma.guest.create({
    data: {
      firstName: 'Palakolanu',
      lastName: 'Varshitha',
      email: 'varshitha@example.com',
      phone: '+91 9876543211',
    }
  });

  // Create reservations for reserved persons
  const room1 = await prisma.room.findFirst({ where: { room_number: '101' } });
  const room2 = await prisma.room.findFirst({ where: { room_number: '102' } });

  await prisma.reservation.create({
    data: {
      guestId: guest1.id,
      roomId: room1 ? room1.id : 1,
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 86400000 * 2),
      status: 'confirmed',
      totalCharges: 299,
      paidAmount: 0,
      verificationStatus: 'UNVERIFIED',
    }
  });

  await prisma.reservation.create({
    data: {
      guestId: guest2.id,
      roomId: room2 ? room2.id : 2,
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 86400000 * 3),
      status: 'confirmed',
      totalCharges: 450,
      paidAmount: 0,
      verificationStatus: 'UNVERIFIED',
    }
  });

  console.log('✅ Fresh reserved persons created and ready for check-in verification!');
  await prisma.$disconnect();
}

seedFresh().catch(console.error);
