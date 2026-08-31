import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function paginate(data, page, limit) {
  const total = data.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return { items: data.slice(start, start + limit), total, page, limit, pages };
}

export async function listMaintenance(req, res) {
  try {
    const { page = 1, limit = 50, q = '' } = req.query;
    const items = await prisma.maintenance.findMany({ orderBy: { createdAt: 'desc' } });
    const filtered = q
      ? items.filter(i => `${i.issue} ${i.status} ${i.priority} ${i.notes || ''}`.toLowerCase().includes(q.toLowerCase()))
      : items;
    res.json(paginate(filtered, Number(page), Number(limit)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createMaintenance(req, res) {
  try {
    if (!req.body.issue || !String(req.body.issue).trim()) {
      return res.status(400).json({ error: 'Issue description is required' });
    }
    const item = await prisma.maintenance.create({ data: {
      roomId: req.body.roomId ? Number(req.body.roomId) : null,
      issue: String(req.body.issue).trim(),
      priority: req.body.priority || 'normal',
      status: req.body.status || 'open',
      notes: req.body.notes || null
    }});
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateMaintenance(req, res) {
  try {
    const item = await prisma.maintenance.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(req.body.issue && { issue: req.body.issue }),
        ...(req.body.priority && { priority: req.body.priority }),
        ...(req.body.status && { status: req.body.status }),
        ...(req.body.notes !== undefined && { notes: req.body.notes })
      }
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
