import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clean() {
  console.log('Cleaning old dummy reservations and payments...');
  await prisma.payment.deleteMany({});
  await prisma.reservation.deleteMany({});
  console.log('✅ Cleaned all old reservations and payments successfully!');
  await prisma.$disconnect();
}

clean().catch(console.error);
