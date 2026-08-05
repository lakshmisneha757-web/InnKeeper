import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function listNotifications(req, res) {
  try {
    const { limit = 50 } = req.query;
    const items = await prisma.appNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createNotification(req, res) {
  try {
    const item = await prisma.appNotification.create({
      data: {
        type: req.body.type || 'system',
        title: req.body.title,
        message: req.body.message,
        isRead: false
      }
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function markRead(req, res) {
  try {
    const { ids } = req.body;
    // If specific IDs provided, mark only those; otherwise mark all unread
    if (ids && Array.isArray(ids) && ids.length > 0) {
      await prisma.appNotification.updateMany({
        where: { id: { in: ids.map(Number) } },
        data: { isRead: true }
      });
    } else {
      await prisma.appNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true }
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
