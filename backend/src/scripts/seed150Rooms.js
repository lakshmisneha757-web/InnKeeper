import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed150Rooms() {
  console.log('🔄 Updating database rooms to 150 rooms numbered 1 to 150...');

  // Ensure hotel exists
  let hotel = await prisma.hotel.findFirst();
  if (!hotel) {
    hotel = await prisma.hotel.create({
      data: {
        hotel_name: 'InnKeeper Grand Motel',
        address: '123 Highway Road',
        city: 'Hyderabad',
        country: 'India',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
      },
    });
  }

  // Ensure room types exist
  let roomTypes = await prisma.roomType.findMany();
  if (roomTypes.length === 0) {
    roomTypes = await Promise.all([
      prisma.roomType.create({ data: { name: 'Standard', base_price: 1500, capacity: 2, description: 'Standard room' } }),
      prisma.roomType.create({ data: { name: 'Deluxe', base_price: 2500, capacity: 2, description: 'Deluxe room' } }),
      prisma.roomType.create({ data: { name: 'Suite', base_price: 5000, capacity: 3, description: 'Luxury suite' } }),
      prisma.roomType.create({ data: { name: 'Family', base_price: 3500, capacity: 4, description: 'Family room' } }),
      prisma.roomType.create({ data: { name: 'Premium', base_price: 4000, capacity: 2, description: 'Premium room' } }),
    ]);
  }

  const statuses = ['vacant', 'occupied', 'dirty', 'maintenance', 'reserved'];

  // Clean up all existing rooms and dependent tables to ensure a clean 1..150 setup
  console.log('Cleaning existing rooms & dependencies...');
  await prisma.channelInventory.deleteMany({});
  await prisma.pricingHistory.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.housekeeping.deleteMany({});
  await prisma.maintenance.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.room.deleteMany({});

  console.log('Creating 150 rooms numbered 1 to 150...');
  for (let i = 1; i <= 150; i++) {
    const roomNum = `${i}`;
    const floor = Math.floor((i - 1) / 10) + 1; // 10 rooms per floor (Floors 1 to 15)
    const rt = roomTypes[(i - 1) % roomTypes.length];
    
    // Choose status (mostly vacant, some occupied/dirty)
    let status = 'vacant';
    if (i % 7 === 0) status = 'occupied';
    else if (i % 13 === 0) status = 'dirty';
    else if (i % 29 === 0) status = 'maintenance';

    await prisma.room.create({
      data: {
        room_number: roomNum,
        room_type_id: rt.id,
        floor,
        status,
        current_price: rt.base_price,
        availability: status === 'vacant',
        hotel_id: hotel.id,
      },
    });
  }

  // Create sample reservations for testing
  const sampleRooms = await prisma.room.findMany({ take: 10 });
  const sampleGuest = await prisma.guest.findFirst();
  if (sampleGuest && sampleRooms.length > 0) {
    await prisma.reservation.create({
      data: {
        guestId: sampleGuest.id,
        roomId: sampleRooms[0].id,
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000 * 2),
        status: 'confirmed',
        totalCharges: sampleRooms[0].current_price * 2,
        paidAmount: sampleRooms[0].current_price * 2,
        source: 'Direct',
      }
    });
  }

  // Verify room count
  const finalRooms = await prisma.room.findMany({ orderBy: { id: 'asc' } });
  console.log(`✅ Success! Total rooms in DB: ${finalRooms.length}`);
  const sorted = [...finalRooms].sort((a, b) => parseInt(a.room_number, 10) - parseInt(b.room_number, 10));
  console.log(`First room number: ${sorted[0]?.room_number}, Last room number: ${sorted[sorted.length - 1]?.room_number}`);
}

seed150Rooms()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
