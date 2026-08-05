import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function paginate(data, page, limit) {
  const total = data.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return { items: data.slice(start, start + limit), total, page, limit, pages };
}

export async function listHousekeeping(req, res) {
  try {
    const { page = 1, limit = 50, q = '' } = req.query;
    const items = await prisma.housekeeping.findMany({ orderBy: { createdAt: 'desc' } });
    const filtered = q
      ? items.filter(i => `${i.status} ${i.assignedTo || ''} ${i.notes || ''}`.toLowerCase().includes(q.toLowerCase()))
      : items;
    res.json(paginate(filtered, Number(page), Number(limit)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createHousekeeping(req, res) {
  try {
    const item = await prisma.housekeeping.create({ data: {
      roomId: req.body.roomId ? Number(req.body.roomId) : null,
      status: req.body.status || 'pending',
      assignedTo: req.body.assignedTo || null,
      notes: req.body.notes || null
    }});
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateHousekeeping(req, res) {
  try {
    const item = await prisma.housekeeping.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(req.body.status && { status: req.body.status }),
        ...(req.body.assignedTo !== undefined && { assignedTo: req.body.assignedTo }),
        ...(req.body.notes !== undefined && { notes: req.body.notes })
      }
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
