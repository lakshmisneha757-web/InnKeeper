import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('Port123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'jahnavigorla8@gmail.com' },
    update: { password: hashed, role: 'admin' },
    create: {
      name: 'Jahnavi',
      email: 'jahnavigorla8@gmail.com',
      password: hashed,
      role: 'admin',
    },
  });
  console.log('✅ User ready:', user.email, '| role:', user.role);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
