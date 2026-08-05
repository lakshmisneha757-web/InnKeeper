import { eq, desc, and, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, guests, rooms, reservations, notifications } from "../drizzle/schema";
import type { Guest, Room, Reservation, Notification } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============= ROOMS =============

export async function getAllRooms() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rooms).orderBy(rooms.number);
}

export async function getRoomsByFilter(filters: { type?: string; floor?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters.type) conditions.push(eq(rooms.type, filters.type as any));
  if (filters.floor) conditions.push(eq(rooms.floor, filters.floor));
  if (filters.status) conditions.push(eq(rooms.status, filters.status as any));
  if (conditions.length === 0) return db.select().from(rooms).orderBy(rooms.number);
  return db.select().from(rooms).where(and(...conditions)).orderBy(rooms.number);
}

export async function updateRoomStatus(roomId: number, status: string) {
  const db = await getDb();
  if (!db) return null;
  await db.update(rooms).set({ status: status as any }).where(eq(rooms.id, roomId));
  return db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
}

export async function assignRoom(roomId: number, reservationId: number) {
  const db = await getDb();
  if (!db) return null;
  await db.update(reservations).set({ roomId }).where(eq(reservations.id, reservationId));
  await db.update(rooms).set({ status: "occupied" }).where(eq(rooms.id, roomId));
  return db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
}

// ============= GUESTS =============

export async function getAllGuests() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(guests).orderBy(desc(guests.createdAt));
}

export async function searchGuests(query: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(guests).where(
    or(
      like(guests.firstName, `%${query}%`),
      like(guests.lastName, `%${query}%`),
      like(guests.email, `%${query}%`),
    )
  ).orderBy(desc(guests.createdAt)).limit(20);
}

export async function insertGuest(guest: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(guests).values(guest as any);
  return { insertId: result[0].insertId };
}

// ============= RESERVATIONS =============

export async function getAllReservations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reservations).orderBy(desc(reservations.checkIn));
}

export async function getTodayArrivals() {
  const db = await getDb();
  if (!db) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return db.select().from(reservations).where(
    and(
      sql`DATE(${reservations.checkIn}) = CURDATE()`,
      eq(reservations.status, "confirmed")
    )
  ).orderBy(reservations.checkIn);
}

export async function getTodayDepartures() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reservations).where(
    and(
      sql`DATE(${reservations.checkOut}) = CURDATE()`,
      eq(reservations.status, "checked_in")
    )
  ).orderBy(reservations.checkOut);
}

export async function getReservationsForTapeChart(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];
  const startStr = new Date(startDate);
  startStr.setHours(0, 0, 0, 0);
  const endStr = new Date(endDate);
  endStr.setHours(23, 59, 59, 999);
  return db.select().from(reservations).where(
    and(
      sql`${reservations.checkIn} < ${endStr.toISOString().slice(0, 19).replace('T', ' ')}`,
      sql`${reservations.checkOut} >= ${startStr.toISOString().slice(0, 19).replace('T', ' ')}`,
    )
  ).orderBy(reservations.checkIn);
}

export async function checkInReservation(reservationId: number, roomId: number) {
  const db = await getDb();
  if (!db) return null;
  await db.update(reservations).set({ status: "checked_in", roomId }).where(eq(reservations.id, reservationId));
  await db.update(rooms).set({ status: "occupied" }).where(eq(rooms.id, roomId));
  return { success: true };
}

export async function checkOutReservation(reservationId: number, roomId: number) {
  const db = await getDb();
  if (!db) return null;
  await db.update(reservations).set({ status: "checked_out" }).where(eq(reservations.id, reservationId));
  await db.update(rooms).set({ status: "dirty" }).where(eq(rooms.id, roomId));
  return { success: true };
}

export async function updateReservationCharges(reservationId: number, amount: number) {
  const db = await getDb();
  if (!db) return null;
  await db.update(reservations).set({ totalCharges: amount }).where(eq(reservations.id, reservationId));
  return { success: true };
}

export async function getReservationHistory(roomId?: number, guestId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (roomId) {
    return db.select().from(reservations).where(eq(reservations.roomId, roomId)).orderBy(desc(reservations.checkIn)).limit(50);
  }
  if (guestId) {
    return db.select().from(reservations).where(eq(reservations.guestId, guestId)).orderBy(desc(reservations.checkIn)).limit(50);
  }
  return db.select().from(reservations).orderBy(desc(reservations.checkIn)).limit(50);
}

export async function assignReservationToRoom(reservationId: number, newRoomId: number, oldRoomId?: number) {
  const db = await getDb();
  if (!db) return null;
  // Update the reservation to the new room
  await db.update(reservations).set({ roomId: newRoomId }).where(eq(reservations.id, reservationId));
  // Set new room to occupied
  await db.update(rooms).set({ status: "occupied" }).where(eq(rooms.id, newRoomId));
  // If there was an old room, set it back to vacant
  if (oldRoomId && oldRoomId !== newRoomId) {
    await db.update(rooms).set({ status: "vacant" }).where(eq(rooms.id, oldRoomId));
  }
  return db.select().from(reservations).where(eq(reservations.id, reservationId)).limit(1);
}

// ============= NOTIFICATIONS =============

export async function getNotifications(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function markNotificationRead(notificationId: number) {
  const db = await getDb();
  if (!db) return null;
  await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, notificationId));
  return { success: true };
}

export async function markAllNotificationsRead() {
  const db = await getDb();
  if (!db) return null;
  await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.isRead, 0));
  return { success: true };
}

export async function getUnreadCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(notifications).where(eq(notifications.isRead, 0));
  return result.length;
}

export async function insertNotification(notification: Omit<Notification, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(notifications).values(notification as any);
  return { insertId: result[0].insertId };
}
