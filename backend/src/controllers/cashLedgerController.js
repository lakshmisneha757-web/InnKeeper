import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function paginate(data, page, limit) {
  const total = data.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return { items: data.slice(start, start + limit), total, page, limit, pages };
}

export async function listCashLedger(req, res) {
  try {
    const { limit = 50, q = '' } = req.query;
    const entries = await prisma.cashLedger.findMany({ orderBy: { createdAt: 'desc' } });
    const filtered = q
      ? entries.filter(e => `${e.employeeName} ${e.status} ${e.notes || ''}`.toLowerCase().includes(q.toLowerCase()))
      : entries;
    res.json(paginate(filtered, 1, Number(limit)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createCashLedger(req, res) {
  try {
    const entry = await prisma.cashLedger.create({
      data: {
        employeeName: req.body.employeeName,
        openingCash: Number(req.body.openingCash ?? 0),
        closingCash: Number(req.body.closingCash ?? 0),
        status: req.body.status || 'open',
        notes: req.body.notes || null
      }
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateCashLedger(req, res) {
  try {
    const entry = await prisma.cashLedger.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(req.body.employeeName && { employeeName: req.body.employeeName }),
        ...(req.body.openingCash !== undefined && { openingCash: Number(req.body.openingCash) }),
        ...(req.body.closingCash !== undefined && { closingCash: Number(req.body.closingCash) }),
        ...(req.body.status && { status: req.body.status }),
        ...(req.body.notes !== undefined && { notes: req.body.notes })
      }
    });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteCashLedger(req, res) {
  try {
    await prisma.cashLedger.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
