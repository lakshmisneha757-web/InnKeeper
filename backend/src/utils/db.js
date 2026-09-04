import { PrismaClient } from '@prisma/client';
import { emitRealtimeUpdate } from './realtime.js';

export const prisma = new PrismaClient();

export async function initializeDb() {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL via Prisma');
  } catch (error) {
    console.warn('PostgreSQL unavailable', error.message);
  }
}

function normalizeRoom(room) {
  return {
    ...room,
    roomNumber: room.room_number,
    roomType: room.room_type?.name || room.room_type,
    currentPrice: room.current_price ?? room.room_type?.base_price ?? 0,
    availability: room.availability,
    lastUpdated: room.last_updated,
    connectedChannels: room.channelInventory?.filter((entry) => entry.available).length ?? 0,
    syncStatus: room.channelInventory?.some((entry) => entry.available) ? 'Synced' : 'Pending'
  };
}

function getDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getRuleComparator(rule, actualValue) {
  switch (rule.comparison) {
    case '<': return actualValue < Number(rule.value);
    case '>': return actualValue > Number(rule.value);
    case '=': return actualValue === Number(rule.value);
    default: return false;
  }
}

function evaluateRule(rule, context) {
  const actualValue = context[rule.condition] ?? 0;
  return getRuleComparator(rule, actualValue);
}

async function recordOccupancySnapshot(reason = 'system') {
  const rooms = await prisma.room.findMany({ include: { room_type: true } });
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((room) => String(room.status).toLowerCase() === 'occupied').length;
  const occupancyPercentage = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  await prisma.occupancyHistory.create({
    data: {
      date: getDateKey(),
      room_type: 'All Rooms',
      occupancy_percentage: occupancyPercentage,
      total_rooms: totalRooms,
      occupied_rooms: occupiedRooms,
      created_at: new Date()
    }
  });

  return { occupancyPercentage, occupiedRooms, totalRooms, reason };
}

async function updateStatistics() {
  const rooms = await prisma.room.findMany();
  const channels = await prisma.channel.findMany();
  const rules = await prisma.pricingRule.findMany();
  const logs = await prisma.syncLog.findMany();
  const bookings = await prisma.booking.findMany({ where: { booking_status: { not: 'Cancelled' } } });
  const occupancy = await prisma.occupancyHistory.findMany({ orderBy: { created_at: 'desc' }, take: 1 });
  const averageSyncTime = logs.length
    ? Number((logs.reduce((sum, log) => sum + Number((log.response_time || '0s').replace(/s/g, '')), 0) / logs.length).toFixed(1))
    : 0;

  const payload = {
    date: getDateKey(),
    total_rooms: rooms.length,
    occupied_rooms: rooms.filter((room) => String(room.status).toLowerCase() === 'occupied').length,
    available_rooms: rooms.filter((room) => room.availability).length,
    connected_channels: channels.filter((channel) => channel.connected).length,
    active_bookings: bookings.length,
    average_occupancy: occupancy[0]?.occupancy_percentage ?? 0,
    average_sync_time: averageSyncTime,
    pricing_rules_enabled: rules.filter((rule) => rule.enabled).length,
    created_at: new Date()
  };

  await prisma.statistics.create({ data: payload });
  emitRealtimeUpdate('module2:stats', payload);
  return payload;
}

async function syncAllChannels(reason = 'Manual Sync', roomId = null) {
  const channels = await prisma.channel.findMany({ orderBy: { id: 'asc' } });
  const rooms = await prisma.room.findMany({ orderBy: { id: 'asc' } });

  for (const channel of channels) {
    for (const room of rooms) {
      await prisma.channelInventory.upsert({
        where: { channel_id_room_id: { channel_id: channel.id, room_id: room.id } },
        update: { available: room.availability, price: room.current_price, last_synced: new Date() },
        create: { channel_id: channel.id, room_id: room.id, available: room.availability, price: room.current_price, last_synced: new Date() }
      });
    }

    await prisma.channel.update({
      where: { id: channel.id },
      data: { connected: channel.connected, api_status: 'Healthy', last_sync: new Date() }
    });

    await prisma.syncLog.create({
      data: {
        channel: channel.channel_name,
        room: roomId ? `${roomId}` : 'All Rooms',
        action: reason,
        status: 'Success',
        response_time: `${(0.8 + Math.random() * 0.5).toFixed(1)}s`,
        message: `${channel.channel_name} synchronized for ${reason}`,
        created_at: new Date()
      }
    });
  }
}

async function recalculatePricing({ reason = 'Pricing recalculation', triggeredBy = 'system', scope = 'direct' } = {}) {
  const rooms = await prisma.room.findMany({ include: { room_type: true }, orderBy: { id: 'asc' } });
  const rules = await prisma.pricingRule.findMany({ where: { enabled: true }, orderBy: { priority: 'desc' } });
  const occupancySnapshot = await recordOccupancySnapshot(reason);
  const appliedRooms = [];

  for (const room of rooms) {
    let price = Number(room.room_type.base_price);
    let appliedRules = [];

    for (const rule of rules) {
      if (rule.scope && scope !== 'all' && rule.scope !== scope) continue;
      const context = {
        occupancy: occupancySnapshot.occupancyPercentage,
        time: new Date().getHours(),
        weekend: [0, 6].includes(new Date().getDay()),
        festival: new Date().getMonth() === 11 && new Date().getDate() >= 20,
        holiday: [12, 24, 25, 26, 31].includes(new Date().getDate()) && new Date().getMonth() === 11,
        channel: 'direct'
      };

      if (evaluateRule(rule, context)) {
        if (rule.action === 'increase') {
          price = price * (1 + Number(rule.percentage) / 100);
        } else if (rule.action === 'reduce') {
          price = price * (1 - Number(rule.percentage) / 100);
        }
        appliedRules.push(rule.rule_name);
      }
    }

    const oldPrice = Number(room.current_price ?? room.room_type.base_price);
    const newPrice = Number(price.toFixed(2));

    if (oldPrice !== newPrice) {
      await prisma.room.update({
        where: { id: room.id },
        data: { current_price: newPrice, last_updated: new Date() }
      });
    }

    await prisma.pricingHistory.create({
      data: {
        room_id: room.id,
        old_price: oldPrice,
        new_price: newPrice,
        difference: Number((newPrice - oldPrice).toFixed(2)),
        reason: appliedRules.length > 0 ? appliedRules.join(', ') : reason,
        triggered_by: triggeredBy,
        created_at: new Date()
      }
    });

    appliedRooms.push({ roomId: room.id, oldPrice, newPrice, reason: appliedRules.join(', ') || reason });
  }

  await updateStatistics();
  emitRealtimeUpdate('module2:pricing', { appliedRooms, occupancySnapshot, reason });
  return { appliedRooms, occupancySnapshot };
}

export async function getDashboardData() {
  const rooms = await prisma.room.findMany({ include: { room_type: true, channelInventory: { include: { channel: true } } } });
  const channels = await prisma.channel.findMany({ orderBy: { id: 'asc' } });
  const logs = await prisma.syncLog.findMany({ take: 5, orderBy: { created_at: 'desc' } });
  const pricingHistory = await prisma.pricingHistory.findMany({ take: 6, orderBy: { created_at: 'desc' } });
  const occupancy = await prisma.occupancyHistory.findMany({ take: 8, orderBy: { date: 'asc' } });

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((room) => String(room.status).toLowerCase() === 'occupied').length;
  const availableRooms = rooms.filter((room) => room.availability).length;
  const connectedChannels = channels.filter((channel) => channel.connected).length;
  const occupancyPercent = Math.round((occupiedRooms / totalRooms) * 100);

  return {
    totalRooms,
    occupiedRooms,
    availableRooms,
    occupancyPercent,
    connectedChannels,
    rooms: rooms.map(normalizeRoom),
    channels,
    logs,
    pricingHistory,
    occupancy,
    occupancyChart: occupancy.slice(-6).map((entry) => ({ name: entry.date, value: entry.occupancy_percentage })),
    revenueChart: pricingHistory.slice(0, 6).map((entry) => ({ name: entry.reason, value: entry.new_price }))
  };
}

export async function getRooms() {
  const rooms = await prisma.room.findMany({
    include: { room_type: true, channelInventory: { include: { channel: true } } },
    orderBy: { id: 'asc' }
  });
  return rooms.map(normalizeRoom);
}

export async function createRoom(payload) {
  const roomTypeId = payload.room_type_id ?? payload.roomTypeId ?? null;
  const roomType = roomTypeId
    ? await prisma.roomType.findUnique({ where: { id: Number(roomTypeId) } })
    : await prisma.roomType.findFirst();

  if (!roomType) throw new Error('Room type not found');

  const room = await prisma.room.create({
    data: {
      room_number: payload.room_number ?? payload.roomNumber,
      room_type_id: roomType.id,
      floor: Number(payload.floor ?? 1),
      status: payload.status ?? 'Vacant',
      current_price: Number(payload.current_price ?? roomType.base_price),
      availability: payload.availability ?? true,
      hotel_id: payload.hotel_id ?? 1,
      last_updated: new Date()
    },
    include: { room_type: true }
  });

  await syncAllChannels('Room Created', room.id);
  await updateStatistics();
  emitRealtimeUpdate('module2:rooms', { action: 'created', room });
  return normalizeRoom(room);
}

export async function updateRoom(roomId, payload) {
  const room = await prisma.room.update({
    where: { id: Number(roomId) },
    data: {
      room_number: payload.room_number ?? payload.roomNumber,
      floor: Number(payload.floor ?? undefined),
      status: payload.status,
      current_price: payload.current_price ? Number(payload.current_price) : undefined,
      availability: payload.availability !== undefined ? Boolean(payload.availability) : undefined,
      last_updated: new Date()
    },
    include: { room_type: true, channelInventory: { include: { channel: true } } }
  });

  await syncAllChannels('Room Updated', room.id);
  await updateStatistics();
  emitRealtimeUpdate('module2:rooms', { action: 'updated', room });
  return normalizeRoom(room);
}

export async function deleteRoom(roomId) {
  const activeBookings = await prisma.reservation.findMany({
    where: {
      roomId: Number(roomId),
      status: { in: ['confirmed', 'checked_in'] }
    }
  });

  if (activeBookings.length > 0) {
    throw new Error(`Cannot delete room #${roomId}: ${activeBookings.length} active reservation(s) currently exist. Relocate or check out guests first.`);
  }

  await prisma.channelInventory.deleteMany({ where: { room_id: Number(roomId) } });
  await prisma.pricingHistory.deleteMany({ where: { room_id: Number(roomId) } });
  await prisma.booking.deleteMany({ where: { room_id: Number(roomId) } });
  const room = await prisma.room.delete({ where: { id: Number(roomId) } });
  await syncAllChannels('Room Deleted', room.id);
  await updateStatistics();
  emitRealtimeUpdate('module2:rooms', { action: 'deleted', room });
  return room;
}

export async function updateRoomAvailability(roomId, payload) {
  const room = await prisma.room.update({
    where: { id: Number(roomId) },
    data: {
      availability: Boolean(payload.availability ?? true),
      status: payload.status || (payload.availability ? 'Vacant' : 'Occupied'),
      current_price: payload.current_price ? Number(payload.current_price) : undefined,
      last_updated: new Date()
    },
    include: { room_type: true }
  });

  await syncAllChannels('Availability Updated', room.id);
  await recalculatePricing({ reason: payload.reason || 'Availability Updated', triggeredBy: 'availability', scope: 'direct' });
  await updateStatistics();
  emitRealtimeUpdate('module2:rooms', { action: 'availability', room });
  return normalizeRoom(room);
}

export async function getBookings() {
  const bookings = await prisma.booking.findMany({ include: { room: { include: { room_type: true } } }, orderBy: { created_at: 'desc' } });
  return bookings.map((booking) => ({
    ...booking,
    roomNumber: booking.room?.room_number,
    roomType: booking.room?.room_type?.name,
    roomStatus: booking.room?.status
  }));
}

export async function createBooking(payload) {
  const room = await prisma.room.findUnique({ where: { id: Number(payload.room_id ?? payload.roomId) }, include: { room_type: true } });
  if (!room) throw new Error('Room not found');

  const st = String(room.status || '').toLowerCase();
  let reason = null;
  if (st === 'dirty') reason = 'dirty';
  else if (st === 'maintenance' || st === 'under_maintenance' || st === 'out_of_service') reason = 'under maintenance';
  else if (st === 'occupied') reason = 'occupied';
  else if (room.availability === false) reason = 'unavailable';

  if (reason) {
    throw new Error(`Room #${room.room_number || room.id} is ${reason} and cannot be reserved for a new booking.`);
  }

  const booking = await prisma.booking.create({
    data: {
      booking_number: payload.booking_number || payload.bookingNumber || `BK-${Date.now()}`,
      room_id: room.id,
      booking_source: payload.booking_source || payload.bookingSource || 'Walk-in',
      guest_name: payload.guest_name || payload.guestName || 'Guest',
      check_in: new Date(payload.check_in || payload.checkIn),
      check_out: new Date(payload.check_out || payload.checkOut),
      booking_status: payload.booking_status || payload.bookingStatus || 'Confirmed',
      created_at: new Date()
    },
    include: { room: { include: { room_type: true } } }
  });

  await prisma.room.update({
    where: { id: room.id },
    data: { availability: false, status: 'Occupied', last_updated: new Date() }
  });

  await syncAllChannels('Booking Created', room.id);
  await recalculatePricing({ reason: 'Booking Created', triggeredBy: 'booking', scope: 'direct' });
  await updateStatistics();
  emitRealtimeUpdate('module2:bookings', { action: 'created', booking });
  return booking;
}

export async function updateBooking(bookingId, payload) {
  const booking = await prisma.booking.update({
    where: { id: Number(bookingId) },
    data: {
      booking_status: payload.booking_status || payload.bookingStatus,
      booking_source: payload.booking_source || payload.bookingSource,
      guest_name: payload.guest_name || payload.guestName,
      check_in: payload.check_in ? new Date(payload.check_in) : undefined,
      check_out: payload.check_out ? new Date(payload.check_out) : undefined
    },
    include: { room: { include: { room_type: true } } }
  });

  if (booking.booking_status === 'Cancelled') {
    await prisma.room.update({
      where: { id: booking.room_id },
      data: { availability: true, status: 'Vacant', last_updated: new Date() }
    });
  }

  await syncAllChannels('Booking Updated', booking.room_id);
  await recalculatePricing({ reason: 'Booking Updated', triggeredBy: 'booking', scope: 'direct' });
  await updateStatistics();
  emitRealtimeUpdate('module2:bookings', { action: 'updated', booking });
  return booking;
}

export async function cancelBooking(bookingId) {
  const booking = await prisma.booking.update({
    where: { id: Number(bookingId) },
    data: { booking_status: 'Cancelled' },
    include: { room: { include: { room_type: true } } }
  });

  await prisma.room.update({
    where: { id: booking.room_id },
    data: { availability: true, status: 'Vacant', last_updated: new Date() }
  });

  await syncAllChannels('Booking Cancelled', booking.room_id);
  await recalculatePricing({ reason: 'Booking Cancelled', triggeredBy: 'booking', scope: 'direct' });
  await updateStatistics();
  emitRealtimeUpdate('module2:bookings', { action: 'cancelled', booking });
  return booking;
}

export async function deleteBooking(bookingId) {
  const booking = await prisma.booking.delete({ where: { id: Number(bookingId) } });
  await prisma.room.update({
    where: { id: booking.room_id },
    data: { availability: true, status: 'Vacant', last_updated: new Date() }
  });
  await syncAllChannels('Booking Deleted', booking.room_id);
  await updateStatistics();
  emitRealtimeUpdate('module2:bookings', { action: 'deleted', booking });
  return booking;
}

export async function getChannels() {
  return prisma.channel.findMany({ orderBy: { id: 'asc' } });
}

export async function connectChannel(channelId) {
  const channel = await prisma.channel.update({
    where: { id: Number(channelId) },
    data: { connected: true, api_status: 'Healthy', last_sync: new Date() }
  });
  await updateStatistics();
  return channel;
}

export async function disconnectChannel(channelId) {
  const channel = await prisma.channel.update({
    where: { id: Number(channelId) },
    data: { connected: false, api_status: 'Offline', last_sync: new Date() }
  });
  await updateStatistics();
  return channel;
}

export async function reconnectChannel(channelId) {
  return connectChannel(channelId);
}

export async function syncChannel(channelId) {
  const channel = await prisma.channel.findUnique({ where: { id: Number(channelId) } });
  if (!channel) throw new Error('Channel not found');

  await syncAllChannels('Manual Sync', null);
  await prisma.channel.update({
    where: { id: channel.id },
    data: { connected: true, api_status: 'Healthy', last_sync: new Date() }
  });
  await updateStatistics();
  emitRealtimeUpdate('module2:channels', { action: 'synced', channel });
  return { ...channel, last_sync: new Date() };
}

export async function getPricingRules() {
  return prisma.pricingRule.findMany({ orderBy: { priority: 'desc' } });
}

export async function createPricingRule(payload) {
  const rule = await prisma.pricingRule.create({
    data: {
      ...payload,
      enabled: payload.enabled ?? true,
      priority: Number(payload.priority) || 1,
      percentage: Number(payload.percentage) || 0,
      value: Number(payload.value) || 0
    }
  });
  await updateStatistics();
  return rule;
}

export async function updatePricingRule(ruleId, payload) {
  const rule = await prisma.pricingRule.update({
    where: { id: Number(ruleId) },
    data: {
      ...payload,
      priority: Number(payload.priority) || 1,
      percentage: Number(payload.percentage) || 0,
      value: Number(payload.value) || 0
    }
  });
  await recalculatePricing({ reason: 'Rule Updated', triggeredBy: 'rule', scope: 'direct' });
  await updateStatistics();
  emitRealtimeUpdate('module2:rules', { action: 'updated', rule });
  return rule;
}

export async function deletePricingRule(ruleId) {
  const rule = await prisma.pricingRule.delete({ where: { id: Number(ruleId) } });
  await recalculatePricing({ reason: 'Rule Deleted', triggeredBy: 'rule', scope: 'direct' });
  await updateStatistics();
  emitRealtimeUpdate('module2:rules', { action: 'deleted', rule });
  return rule;
}

export async function togglePricingRule(ruleId) {
  const current = await prisma.pricingRule.findUnique({ where: { id: Number(ruleId) } });
  if (!current) throw new Error('Rule not found');
  const rule = await prisma.pricingRule.update({ where: { id: Number(ruleId) }, data: { enabled: !current.enabled } });
  await recalculatePricing({ reason: 'Rule Toggled', triggeredBy: 'rule', scope: 'direct' });
  await updateStatistics();
  emitRealtimeUpdate('module2:rules', { action: 'toggled', rule });
  return rule;
}

export async function recalculatePrices(reason = 'Manual Recalculation') {
  const result = await recalculatePricing({ reason, triggeredBy: 'manual', scope: 'direct' });
  await syncAllChannels('Pricing Recalculated', null);
  await updateStatistics();
  emitRealtimeUpdate('module2:pricing', { action: 'recalculated', result });
  return result;
}

export async function getPricingHistory() {
  return prisma.pricingHistory.findMany({ orderBy: { created_at: 'desc' } });
}

export async function getSyncLogs() {
  return prisma.syncLog.findMany({ orderBy: { created_at: 'desc' } });
}

export async function getStatistics() {
  const stats = await prisma.statistics.findMany({ orderBy: { created_at: 'desc' }, take: 1 });
  if (stats[0]) return stats[0];
  return updateStatistics();
}

export async function getOccupancyHistory() {
  return prisma.occupancyHistory.findMany({ orderBy: { date: 'asc' } });
}

