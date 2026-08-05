import { Router } from "express";
import { z } from "zod";
import { hasDatabaseConfig, prisma } from "../prisma/client";
import { authenticateJwt, requireRole } from "../middleware/auth";
import { buildPaymentRecord, normalizePaymentMethod, normalizePaymentStatus } from "../lib/payment";

const router = Router();

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  q: z.string().optional(),
});

const roomSchema = z.object({
  number: z.string().min(1),
  name: z.string().optional(),
  type: z.string().min(1),
  floor: z.coerce.number().int().min(1),
  status: z.string().default("vacant"),
  rate: z.coerce.number().min(0).default(0),
});

const reservationSchema = z.object({
  guestId: z.string().min(1),
  roomId: z.string().optional(),
  roomNumber: z.string().optional(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  status: z.string().default("confirmed"),
  totalCharges: z.coerce.number().min(0).default(0),
  specialNotes: z.string().optional(),
});

const guestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  specialRequests: z.string().optional(),
  loyaltyPoints: z.coerce.number().int().min(0).default(0),
});

const paymentSchema = z.object({
  reservationId: z.string().min(1),
  guestId: z.string().optional().or(z.literal("")),
  roomId: z.string().optional().or(z.literal("")),
  amount: z.coerce.number().min(0),
  tax: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  finalAmount: z.coerce.number().min(0).optional(),
  method: z.string().optional().or(z.literal("")),
  transactionId: z.string().optional(),
  cardLast4: z.string().optional(),
  paymentStatus: z.string().default("pending"),
  paymentDate: z.string().datetime().optional(),
  processedBy: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
});

const cashLedgerSchema = z.object({
  employeeName: z.string().min(1),
  openingTime: z.string().datetime().optional(),
  closingTime: z.string().datetime().optional(),
  openingCash: z.coerce.number().min(0).default(0),
  closingCash: z.coerce.number().min(0).default(0),
  expectedCash: z.coerce.number().min(0).default(0),
  actualCash: z.coerce.number().min(0).default(0),
  difference: z.coerce.number().default(0),
  variance: z.coerce.number().default(0),
  status: z.string().default("open"),
  notes: z.string().optional(),
  movementHistory: z.string().optional(),
});

const shiftAuditSchema = z.object({
  employeeName: z.string().min(1),
  openingTime: z.string().datetime().optional(),
  closingTime: z.string().datetime().optional(),
  openingCash: z.coerce.number().min(0).default(0),
  closingCash: z.coerce.number().min(0).default(0),
  expectedCash: z.coerce.number().min(0).default(0),
  actualCash: z.coerce.number().min(0).default(0),
  difference: z.coerce.number().default(0),
  variance: z.coerce.number().default(0),
  status: z.string().default("open"),
  notes: z.string().optional(),
});

const vehicleSchema = z.object({
  guestId: z.string().optional(),
  reservationId: z.string().optional(),
  make: z.string().min(1),
  model: z.string().min(1),
  licensePlate: z.string().min(1),
  state: z.string().min(1),
  color: z.string().optional(),
  vehicleType: z.string().default("car"),
  parkingSlot: z.string().optional(),
  parkingStatus: z.string().default("parked"),
  arrivalTime: z.string().datetime().optional(),
  departureTime: z.string().datetime().optional(),
  securityNotes: z.string().optional(),
});

const housekeepingSchema = z.object({
  roomId: z.string().min(1),
  status: z.string().min(1),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

const maintenanceSchema = z.object({
  roomId: z.string().min(1),
  issue: z.string().min(1),
  priority: z.string().default("medium"),
  status: z.string().default("open"),
  assignedTo: z.string().optional(),
});

const notificationSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  isRead: z.boolean().optional(),
});

function buildSort(sortBy?: string, sortOrder: "asc" | "desc" = "asc") {
  if (!sortBy) return undefined;
  return { [sortBy]: sortOrder } as Record<string, "asc" | "desc">;
}

function buildSearchFilter(q?: string) {
  if (!q) return undefined;
  return {
    OR: [
      { number: { contains: q, mode: "insensitive" as const } },
      { name: { contains: q, mode: "insensitive" as const } },
      { type: { contains: q, mode: "insensitive" as const } },
    ],
  };
}

function parsePagination(req: any) {
  const parsed = paginationSchema.safeParse(req.query);
  if (!parsed.success) return paginationSchema.parse({});
  return parsed.data;
}

function isDatabaseUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /Environment variable not found: DATABASE_URL|Can't reach database|ECONNREFUSED|P1001|P1017|P2024|Error validating datasource|must start with the protocol|prisma:\/\/|prisma\+postgres/i.test(message);
}

async function withDatabase<T>(operation: () => Promise<T>, fallback: T) {
  if (!hasDatabaseConfig()) return fallback;
  try {
    return await operation();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) return fallback;
    throw error;
  }
}

router.get("/rooms", async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder, q } = parsePagination(req);
    const payload = await withDatabase(async () => {
      const skip = (page - 1) * limit;
      const where = buildSearchFilter(q) ?? {};
      const [items, total] = await Promise.all([
        prisma.room.findMany({ where, skip, take: limit, orderBy: buildSort(sortBy, sortOrder) ?? { number: "asc" } }),
        prisma.room.count({ where }),
      ]);
      return { items, page, limit, total, pages: Math.ceil(total / limit) };
    }, { items: [], page, limit, total: 0, pages: 0 });
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.get("/rooms/:id", async (req, res, next) => {
  try {
    const room = await prisma.room.findUnique({ where: { id: req.params.id } });
    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json(room);
  } catch (error) {
    next(error);
  }
});

router.post("/rooms", async (req, res, next) => {
  try {
    const payload = roomSchema.parse(req.body);
    const room = await prisma.room.create({ data: payload });
    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
});

router.put("/rooms/:id", async (req, res, next) => { 
   try {
    const payload = roomSchema.partial().parse(req.body);
    const room = await prisma.room.update({ where: { id: req.params.id }, data: payload });
    res.json(room);
  } catch (error) {
    next(error);
  }
});

router.delete("/rooms/:id", async (req, res, next) => {
  try {
    await prisma.room.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/reservations", async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder, q } = parsePagination(req);
    const payload = await withDatabase(async () => {
      const skip = (page - 1) * limit;
      const where = q ? { OR: [{ roomNumber: { contains: q, mode: "insensitive" as const } }, { status: { contains: q, mode: "insensitive" as const } }] } : {};
      const [items, total] = await Promise.all([
        prisma.reservation.findMany({ where, skip, take: limit, orderBy: buildSort(sortBy, sortOrder) ?? { checkIn: "asc" } }),
        prisma.reservation.count({ where }),
      ]);
      return { items, page, limit, total, pages: Math.ceil(total / limit) };
    }, { items: [], page, limit, total: 0, pages: 0 });
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.post("/rooms", async (req, res, next) => {
  try {
    const payload = roomSchema.parse(req.body);

    const room = await prisma.room.create({
      data: payload,
    });

    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
});

router.put("/reservations/:id", async (req, res, next) => {
  try {
    const payload = reservationSchema.partial().parse(req.body);
    const reservation = await prisma.reservation.update({ where: { id: req.params.id }, data: { ...payload, checkIn: payload.checkIn ? new Date(payload.checkIn) : undefined, checkOut: payload.checkOut ? new Date(payload.checkOut) : undefined } });
    res.json(reservation);
  } catch (error) {
    next(error);
  }
});

router.delete("/reservations/:id", async (req, res, next) => {
  try {
    await prisma.reservation.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/guests", async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder, q } = parsePagination(req);
    const payload = await withDatabase(async () => {
      const skip = (page - 1) * limit;
      const where = q ? { OR: [{ firstName: { contains: q, mode: "insensitive" as const } }, { lastName: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }] } : {};
      const [items, total] = await Promise.all([
        prisma.guest.findMany({ where, skip, take: limit, orderBy: buildSort(sortBy, sortOrder) ?? { createdAt: "desc" } }),
        prisma.guest.count({ where }),
      ]);
      return { items, page, limit, total, pages: Math.ceil(total / limit) };
    }, { items: [], page, limit, total: 0, pages: 0 });
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.post("/guests", async (req, res, next) => {
  try {
    const payload = guestSchema.parse(req.body);
    const guest = await prisma.guest.create({ data: payload });
    res.status(201).json(guest);
  } catch (error) {
    next(error);
  }
});

router.put("/guests/:id", async (req, res, next) => {
  try {
    const payload = guestSchema.partial().parse(req.body);
    const guest = await prisma.guest.update({ where: { id: req.params.id }, data: payload });
    res.json(guest);
  } catch (error) {
    next(error);
  }
});

router.delete("/guests/:id", async (req, res, next) => {
  try {
    await prisma.guest.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/payments", async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder, q } = parsePagination(req);
    const payload = await withDatabase(async () => {
      const skip = (page - 1) * limit;
      const where = q ? { OR: [{ status: { contains: q, mode: "insensitive" as const } }, { method: { contains: q, mode: "insensitive" as const } }, { reservationId: { contains: q, mode: "insensitive" as const } }] } : {};
      const [items, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take: limit,
          orderBy: buildSort(sortBy, sortOrder) ?? { createdAt: "desc" },
          include: { reservation: { include: { guest: true } } },
        }),
        prisma.payment.count({ where }),
      ]);
      const enrichedItems = items.map((payment) => {
        const guestName = payment.reservation?.guest ? `${payment.reservation.guest.firstName} ${payment.reservation.guest.lastName}`.trim() : "Unknown Guest";
        return {
          ...payment,
          ...buildPaymentRecord({
            reservationId: payment.reservationId,
            amount: payment.amount,
            method: payment.method,
            status: payment.status,
            reservation: {
              id: payment.reservationId,
              guest: payment.reservation?.guest,
              roomId: payment.reservation?.roomId,
            },
          }),
          guest: guestName,
          roomId: payment.reservation?.roomId ?? "",
        };
      });
      return { items: enrichedItems, page, limit, total, pages: Math.ceil(total / limit) };
    }, { items: [], page, limit, total: 0, pages: 0 });
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.get("/payments/:id", async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id }, include: { reservation: { include: { guest: true } } } });
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    const guestName = payment.reservation?.guest ? `${payment.reservation.guest.firstName} ${payment.reservation.guest.lastName}`.trim() : "Unknown Guest";
    res.json({
      ...payment,
      ...buildPaymentRecord({
        reservationId: payment.reservationId,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        reservation: {
          id: payment.reservationId,
          guest: payment.reservation?.guest,
          roomId: payment.reservation?.roomId,
        },
      }),
      guest: guestName,
      roomId: payment.reservation?.roomId ?? "",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/payments", async (req, res, next) => {
  try {
    const payload = paymentSchema.parse(req.body);
    const reservation = await prisma.reservation.findUnique({
      where: { id: payload.reservationId },
      include: { guest: true },
    });

    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    const guestName = reservation.guest ? `${reservation.guest.firstName} ${reservation.guest.lastName}`.trim() : "Unknown Guest";
    const normalizedStatus = normalizePaymentStatus(payload.status ?? payload.paymentStatus);
    const normalizedMethod = normalizePaymentMethod(payload.method || "Cash");

    const payment = await prisma.payment.create({
      data: {
        reservationId: payload.reservationId,
        amount: payload.amount,
        method: normalizedMethod,
        status: normalizedStatus,
      },
    });

    const enriched = {
      ...payment,
      ...buildPaymentRecord({
        reservationId: payload.reservationId,
        amount: payload.amount,
        method: normalizedMethod,
        status: normalizedStatus,
        reservation: {
          id: reservation.id,
          guest: reservation.guest,
          roomId: reservation.roomId,
        },
      }),
      guest: guestName,
      roomId: reservation.roomId ?? "",
    };

    res.status(201).json(enriched);
  } catch (error) {
    next(error);
  }
});

router.put("/payments/:id", async (req, res, next) => {
  try {
    const payload = paymentSchema.partial().parse(req.body);
    const existingPayment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!existingPayment) return res.status(404).json({ error: "Payment not found" });

    const reservation = payload.reservationId
      ? await prisma.reservation.findUnique({ where: { id: payload.reservationId }, include: { guest: true } })
      : await prisma.reservation.findUnique({ where: { id: existingPayment.reservationId }, include: { guest: true } });

    const normalizedStatus = normalizePaymentStatus(payload.status ?? payload.paymentStatus ?? existingPayment.status);
    const normalizedMethod = normalizePaymentMethod(payload.method || existingPayment.method);

    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        ...(payload.reservationId ? { reservationId: payload.reservationId } : {}),
        ...(payload.amount !== undefined ? { amount: payload.amount } : {}),
        method: normalizedMethod,
        status: normalizedStatus,
      },
    });

    const enriched = {
      ...payment,
      ...buildPaymentRecord({
        reservationId: payment.reservationId,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        reservation: {
          id: reservation?.id ?? payment.reservationId,
          guest: reservation?.guest,
          roomId: reservation?.roomId,
        },
      }),
      guest: reservation?.guest ? `${reservation.guest.firstName} ${reservation.guest.lastName}`.trim() : existingPayment.reservationId,
      roomId: reservation?.roomId ?? "",
    };

    res.json(enriched);
  } catch (error) {
    next(error);
  }
});

router.delete("/payments/:id", async (req, res, next) => {
  try {
    await prisma.payment.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/cash-ledger", async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder, q } = parsePagination(req);
    const skip = (page - 1) * limit;
    const where = q ? { OR: [{ employeeName: { contains: q, mode: "insensitive" as const } }, { status: { contains: q, mode: "insensitive" as const } }] } : {};
    const [items, total] = await Promise.all([
      prisma.cashLedger.findMany({ where, skip, take: limit, orderBy: buildSort(sortBy, sortOrder) ?? { createdAt: "desc" } }),
      prisma.cashLedger.count({ where }),
    ]);
    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
});

router.post("/cash-ledger", async (req, res, next) => {
  try {
    const payload = cashLedgerSchema.parse(req.body);
    const ledger = await prisma.cashLedger.create({ data: { ...payload, openingTime: payload.openingTime ? new Date(payload.openingTime) : new Date(), closingTime: payload.closingTime ? new Date(payload.closingTime) : undefined } });
    res.status(201).json(ledger);
  } catch (error) {
    next(error);
  }
});

router.put("/cash-ledger/:id", async (req, res, next) => {
  try {
    const payload = cashLedgerSchema.partial().parse(req.body);
    const ledger = await prisma.cashLedger.update({
      where: { id: req.params.id },
      data: {
        ...(payload.employeeName ? { employeeName: payload.employeeName } : {}),
        ...(payload.openingTime ? { openingTime: new Date(payload.openingTime) } : {}),
        ...(payload.closingTime ? { closingTime: new Date(payload.closingTime) } : {}),
        ...(payload.openingCash !== undefined ? { openingCash: payload.openingCash } : {}),
        ...(payload.closingCash !== undefined ? { closingCash: payload.closingCash } : {}),
        ...(payload.expectedCash !== undefined ? { expectedCash: payload.expectedCash } : {}),
        ...(payload.actualCash !== undefined ? { actualCash: payload.actualCash } : {}),
        ...(payload.difference !== undefined ? { difference: payload.difference } : {}),
        ...(payload.variance !== undefined ? { variance: payload.variance } : {}),
        ...(payload.status ? { status: payload.status } : {}),
        ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
        ...(payload.movementHistory !== undefined ? { movementHistory: payload.movementHistory } : {}),
      },
    });
    res.json(ledger);
  } catch (error) {
    next(error);
  }
});

router.delete("/cash-ledger/:id", async (req, res, next) => {
  try {
    await prisma.cashLedger.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/shift-audits", async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder, q } = parsePagination(req);
    const skip = (page - 1) * limit;
    const where = q ? { OR: [{ employeeName: { contains: q, mode: "insensitive" as const } }, { status: { contains: q, mode: "insensitive" as const } }] } : {};
    const [items, total] = await Promise.all([
      prisma.shiftAudit.findMany({ where, skip, take: limit, orderBy: buildSort(sortBy, sortOrder) ?? { createdAt: "desc" } }),
      prisma.shiftAudit.count({ where }),
    ]);
    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
});

router.post("/shift-audits", async (req, res, next) => { try {
    const payload = shiftAuditSchema.parse(req.body);
    const audit = await prisma.shiftAudit.create({ data: { ...payload, openingTime: payload.openingTime ? new Date(payload.openingTime) : new Date(), closingTime: payload.closingTime ? new Date(payload.closingTime) : undefined } });
    res.status(201).json(audit);
  } catch (error) {
    next(error);
  }
});

router.put("/shift-audits/:id", async (req, res, next) => {
  try {
    const payload = shiftAuditSchema.partial().parse(req.body);
    const audit = await prisma.shiftAudit.update({ where: { id: req.params.id }, data: { ...(payload.openingTime ? { openingTime: new Date(payload.openingTime) } : {}), ...(payload.closingTime ? { closingTime: new Date(payload.closingTime) } : {}), ...(payload.employeeName ? { employeeName: payload.employeeName } : {}), ...(payload.openingCash !== undefined ? { openingCash: payload.openingCash } : {}), ...(payload.closingCash !== undefined ? { closingCash: payload.closingCash } : {}), ...(payload.expectedCash !== undefined ? { expectedCash: payload.expectedCash } : {}), ...(payload.actualCash !== undefined ? { actualCash: payload.actualCash } : {}), ...(payload.difference !== undefined ? { difference: payload.difference } : {}), ...(payload.variance !== undefined ? { variance: payload.variance } : {}), ...(payload.status ? { status: payload.status } : {}), ...(payload.notes !== undefined ? { notes: payload.notes } : {}) } });
    res.json(audit);
  } catch (error) {
    next(error);
  }
});

router.delete("/shift-audits/:id", async (req, res, next) => {
  try {
    await prisma.shiftAudit.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/shift-audit", async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder, q } = parsePagination(req);
    const skip = (page - 1) * limit;
    const where = q ? { OR: [{ employeeName: { contains: q, mode: "insensitive" as const } }, { status: { contains: q, mode: "insensitive" as const } }] } : {};
    const [items, total] = await Promise.all([
      prisma.shiftAudit.findMany({ where, skip, take: limit, orderBy: buildSort(sortBy, sortOrder) ?? { createdAt: "desc" } }),
      prisma.shiftAudit.count({ where }),
    ]);
    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
});

router.post("/shift-audit", async (req, res, next) => { try {
    const payload = shiftAuditSchema.parse(req.body);
    const audit = await prisma.shiftAudit.create({ data: { ...payload, openingTime: payload.openingTime ? new Date(payload.openingTime) : new Date(), closingTime: payload.closingTime ? new Date(payload.closingTime) : undefined } });
    res.status(201).json(audit);
  } catch (error) {
    next(error);
  }
});

router.get("/vehicles", async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder, q } = parsePagination(req);
    const skip = (page - 1) * limit;
    const where = q ? { OR: [{ licensePlate: { contains: q, mode: "insensitive" as const } }, { make: { contains: q, mode: "insensitive" as const } }, { model: { contains: q, mode: "insensitive" as const } }] } : {};
    const [items, total] = await Promise.all([
      prisma.vehicle.findMany({ where, skip, take: limit, orderBy: buildSort(sortBy, sortOrder) ?? { createdAt: "desc" }, include: { guest: true, reservation: true } }),
      prisma.vehicle.count({ where }),
    ]);
    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
});

router.get("/vehicles/:id", async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id }, include: { guest: true, reservation: true } });
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

router.post("/vehicles", async (req, res, next) => {
  try {
    const payload = vehicleSchema.parse(req.body);
    const vehicle = await prisma.vehicle.create({ data: { ...payload, arrivalTime: payload.arrivalTime ? new Date(payload.arrivalTime) : new Date(), departureTime: payload.departureTime ? new Date(payload.departureTime) : undefined }, include: { guest: true, reservation: true } });
    res.status(201).json(vehicle);
  } catch (error) {
    next(error);
  }
});

router.put("/vehicles/:id", async (req, res, next) => {  try {
    const payload = vehicleSchema.partial().parse(req.body);
    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data: { ...payload, arrivalTime: payload.arrivalTime ? new Date(payload.arrivalTime) : undefined, departureTime: payload.departureTime ? new Date(payload.departureTime) : undefined }, include: { guest: true, reservation: true } });
    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

router.delete("/vehicles/:id", async (req, res, next) => {
  try {
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/housekeeping", async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder, q } = parsePagination(req);
    const payload = await withDatabase(async () => {
      const skip = (page - 1) * limit;
      const where = q ? { OR: [{ status: { contains: q, mode: "insensitive" as const } }, { assignedTo: { contains: q, mode: "insensitive" as const } }] } : {};
      const [items, total] = await Promise.all([
        prisma.housekeeping.findMany({ where, skip, take: limit, orderBy: buildSort(sortBy, sortOrder) ?? { createdAt: "desc" } }),
        prisma.housekeeping.count({ where }),
      ]);
      return { items, page, limit, total, pages: Math.ceil(total / limit) };
    }, { items: [], page, limit, total: 0, pages: 0 });
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.post("/housekeeping", authenticateJwt, requireRole(["admin", "manager", "housekeeping"]), async (req, res, next) => {
  try {
    const payload = housekeepingSchema.parse(req.body);
    const item = await prisma.housekeeping.create({ data: payload });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put("/housekeeping/:id", authenticateJwt, requireRole(["admin", "manager", "housekeeping"]), async (req, res, next) => {
  try {
    const payload = housekeepingSchema.partial().parse(req.body);
    const item = await prisma.housekeeping.update({ where: { id: req.params.id }, data: payload });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.get("/maintenance", async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder, q } = parsePagination(req);
    const payload = await withDatabase(async () => {
      const skip = (page - 1) * limit;
      const where = q ? { OR: [{ issue: { contains: q, mode: "insensitive" as const } }, { status: { contains: q, mode: "insensitive" as const } }] } : {};
      const [items, total] = await Promise.all([
        prisma.maintenance.findMany({ where, skip, take: limit, orderBy: buildSort(sortBy, sortOrder) ?? { createdAt: "desc" } }),
        prisma.maintenance.count({ where }),
      ]);
      return { items, page, limit, total, pages: Math.ceil(total / limit) };
    }, { items: [], page, limit, total: 0, pages: 0 });
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.post("/maintenance", authenticateJwt, requireRole(["admin", "manager"]), async (req, res, next) => {
  try {
    const payload = maintenanceSchema.parse(req.body);
    const item = await prisma.maintenance.create({ data: payload });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put("/maintenance/:id", authenticateJwt, requireRole(["admin", "manager"]), async (req, res, next) => {
  try {
    const payload = maintenanceSchema.partial().parse(req.body);
    const item = await prisma.maintenance.update({ where: { id: req.params.id }, data: payload });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.get("/notifications", async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder, q } = parsePagination(req);
    const payload = await withDatabase(async () => {
      const skip = (page - 1) * limit;
      const where = q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { message: { contains: q, mode: "insensitive" as const } }] } : {};
      const [items, total] = await Promise.all([
        prisma.notification.findMany({ where, skip, take: limit, orderBy: buildSort(sortBy, sortOrder) ?? { createdAt: "desc" } }),
        prisma.notification.count({ where }),
      ]);
      return { items, page, limit, total, pages: Math.ceil(total / limit) };
    }, { items: [], page, limit, total: 0, pages: 0 });
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.post("/notifications", authenticateJwt, requireRole(["admin", "manager", "receptionist"]), async (req, res, next) => {
  try {
    const payload = notificationSchema.parse(req.body);
    const item = await prisma.notification.create({ data: payload });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.get("/analytics", async (_req, res, next) => {
  try {
    const payload = await withDatabase(async () => {
      const [occupancy, revenue, arrivals, departures] = await Promise.all([
        prisma.reservation.count({ where: { status: "checked_in" } }),
        prisma.payment.aggregate({ _sum: { amount: true } }),
        prisma.reservation.count({ where: { status: "confirmed" } }),
        prisma.reservation.count({ where: { status: "checked_out" } }),
      ]);
      return { occupancy, revenue: revenue._sum.amount ?? 0, arrivals, departures };
    }, { occupancy: 0, revenue: 0, arrivals: 0, departures: 0 });
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.get("/dashboard", async (_req, res, next) => {
  try {
    const payload = await withDatabase(async () => {
      const [rooms, reservations, guests, notifications] = await Promise.all([
        prisma.room.count(),
        prisma.reservation.count(),
        prisma.guest.count(),
        prisma.notification.count(),
      ]);
      return { rooms, reservations, guests, notifications };
    }, { rooms: 0, reservations: 0, guests: 0, notifications: 0 });
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.get("/weather", async (_req, res) => {
  res.json({ city: "Nairobi", temperature: 24, condition: "Sunny" });
});

router.get("/room-availability", async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder, q } = parsePagination(req);
    const payload = await withDatabase(async () => {
      const skip = (page - 1) * limit;
      const rooms = await prisma.room.findMany({ where: q ? { OR: [{ number: { contains: q, mode: "insensitive" as const } }, { type: { contains: q, mode: "insensitive" as const } }] } : {}, skip, take: limit, orderBy: buildSort(sortBy, sortOrder) ?? { number: "asc" } });
      return { items: rooms, page, limit, total: rooms.length, pages: 1 };
    }, { items: [], page, limit, total: 0, pages: 0 });
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

export default router;
