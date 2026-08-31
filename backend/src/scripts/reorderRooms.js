import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Reordering rooms into continuous numbers (101, 102, 103...)...');

  const rooms = await prisma.room.findMany({ orderBy: { id: 'asc' } });
  console.log(`Found ${rooms.length} rooms in DB.`);

  // Assign continuous room numbers starting from 1 to 150: 1, 2, 3, ... 150
  for (let i = 0; i < rooms.length; i++) {
    const r = rooms[i];
    const cleanRoomNumber = `${i + 1}`;
    const floorNum = Math.floor(i / 10) + 1; // 10 rooms per floor: 1-10 (Floor 1), 11-20 (Floor 2)...

    await prisma.room.update({
      where: { id: r.id },
      data: {
        room_number: cleanRoomNumber,
        floor: floorNum
      }
    });
    console.log(`Updated Room ID ${r.id} -> Room Number: ${cleanRoomNumber} (Floor ${floorNum})`);
  }

  console.log('Rooms successfully reordered continuously!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
