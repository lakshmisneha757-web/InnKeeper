import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function paginate(data, page, limit) {
  const total = data.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return { items: data.slice(start, start + limit), total, page, limit, pages };
}

export async function listGuests(req, res) {
  try {
    const { page = 1, limit = 50, q = '' } = req.query;
    const guests = await prisma.guest.findMany({
      include: { reservations: true },
      orderBy: { createdAt: 'desc' }
    });
    const filtered = q
      ? guests.filter(g => `${g.firstName} ${g.lastName} ${g.email || ''} ${g.phone || ''}`.toLowerCase().includes(q.toLowerCase()))
      : guests;
    res.json(paginate(filtered, Number(page), Number(limit)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createGuest(req, res) {
  try {
    const guest = await prisma.guest.create({ data: req.body });
    res.status(201).json(guest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateGuest(req, res) {
  try {
    const guest = await prisma.guest.update({ where: { id: Number(req.params.id) }, data: req.body });
    res.json(guest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteGuest(req, res) {
  try {
    await prisma.guest.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
