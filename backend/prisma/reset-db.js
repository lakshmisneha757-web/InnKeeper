const { PrismaClient } = require("@prisma/client");

async function resetDb() {
  const prisma = new PrismaClient({
    datasources: { db: { url: "postgresql://postgres:Port123@localhost:5432/postgres" } },
  });
  console.log("Re-creating 'innkeeper' PostgreSQL database...");
  await prisma.$executeRawUnsafe("DROP DATABASE IF EXISTS innkeeper WITH (FORCE);");
  await prisma.$executeRawUnsafe("CREATE DATABASE innkeeper;");
  console.log("Database 'innkeeper' created fresh in PostgreSQL!");
  await prisma.$disconnect();
}

resetDb().catch((e) => {
  console.error("Reset error:", e);
  process.exit(1);
});
