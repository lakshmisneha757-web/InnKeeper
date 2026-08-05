import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function paginate(data, page, limit) {
  const total = data.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return { items: data.slice(start, start + limit), total, page, limit, pages };
}

export async function listVehicles(req, res) {
  try {
    const { page = 1, limit = 20, q = '' } = req.query;
    const vehicles = await prisma.vehicle.findMany({ orderBy: { createdAt: 'desc' } });
    const filtered = q
      ? vehicles.filter(v => `${v.make} ${v.model} ${v.licensePlate} ${v.state} ${v.parkingSlot || ''}`.toLowerCase().includes(q.toLowerCase()))
      : vehicles;
    res.json(paginate(filtered, Number(page), Number(limit)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getVehicle(req, res) {
  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: Number(req.params.id) } });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createVehicle(req, res) {
  try {
    const vehicle = await prisma.vehicle.create({ data: req.body });
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateVehicle(req, res) {
  try {
    const vehicle = await prisma.vehicle.update({ where: { id: Number(req.params.id) }, data: req.body });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteVehicle(req, res) {
  try {
    await prisma.vehicle.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
