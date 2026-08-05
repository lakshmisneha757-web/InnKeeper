import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function paginate(data, page, limit) {
  const total = data.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return { items: data.slice(start, start + limit), total, page, limit, pages };
}

export async function listPayments(req, res) {
  try {
    const { page = 1, limit = 20, q = '' } = req.query;
    const payments = await prisma.payment.findMany({
      include: { reservation: { include: { guest: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const filtered = q
      ? payments.filter(p => `${p.method} ${p.paymentStatus} ${p.notes || ''}`.toLowerCase().includes(q.toLowerCase()))
      : payments;
    res.json(paginate(filtered, Number(page), Number(limit)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getPayment(req, res) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: Number(req.params.id) },
      include: { reservation: { include: { guest: true } } }
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createPayment(req, res) {
  try {
    const { reservationId, amount, method, paymentStatus, notes } = req.body;
    const payment = await prisma.payment.create({
      data: {
        amount: Number(amount),
        method: method || 'Cash',
        paymentStatus: paymentStatus || 'Pending',
        notes: notes || null,
        ...(reservationId && { reservationId: Number(reservationId) })
      }
    });
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updatePayment(req, res) {
  try {
    const { amount, method, paymentStatus, notes, reservationId } = req.body;
    const payment = await prisma.payment.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(method && { method }),
        ...(paymentStatus && { paymentStatus }),
        ...(notes !== undefined && { notes }),
        ...(reservationId !== undefined && { reservationId: reservationId ? Number(reservationId) : null })
      }
    });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deletePayment(req, res) {
  try {
    await prisma.payment.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
