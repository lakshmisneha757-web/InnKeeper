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
    
    // Resolve assigned housekeeper names if stored as user IDs
    const users = await prisma.user.findMany({ select: { id: true, name: true, role: true } });
    const userMap = new Map(users.map(u => [String(u.id), u.name]));

    const enriched = items.map(item => {
      let displayName = item.assignedTo;
      if (item.assignedTo && userMap.has(String(item.assignedTo))) {
        displayName = userMap.get(String(item.assignedTo));
      }
      return {
        ...item,
        assignedTo: displayName || item.assignedTo || null
      };
    });

    const filtered = q
      ? enriched.filter(i => `${i.status} ${i.assignedTo || ''} ${i.notes || ''}`.toLowerCase().includes(q.toLowerCase()))
      : enriched;
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
    const rawId = req.params.id;
    let numericId = Number(rawId);

    if (isNaN(numericId) && typeof rawId === 'string' && rawId.startsWith('dirty-')) {
      const roomId = Number(rawId.replace('dirty-', ''));
      let existing = await prisma.housekeeping.findFirst({ where: { roomId } });
      if (!existing) {
        existing = await prisma.housekeeping.create({
          data: {
            roomId,
            status: req.body.status || 'in-progress',
            assignedTo: req.body.assignedTo || 'Maria Rodriguez',
            notes: req.body.notes || 'Room marked dirty - Turnaround cleaning required'
          }
        });
        return res.json(existing);
      }
      numericId = existing.id;
    }

    if (isNaN(numericId)) {
      return res.status(400).json({ error: 'Invalid housekeeping ID' });
    }

    const item = await prisma.housekeeping.update({
      where: { id: numericId },
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
