import {
  getRooms as fetchRooms,
  createRoom as addRoom,
  updateRoom as updateExistingRoom,
  deleteRoom as removeRoom,
  createBooking as addBooking,
  getBookings as fetchBookings,
  updateBooking as updateExistingBooking,
  cancelBooking as cancelExistingBooking,
  deleteBooking as removeBooking,
  updateRoomAvailability as updateRoomAvailabilityInStore,
  getChannels as fetchChannels,
  syncChannel as runSync,
  connectChannel as connectExistingChannel,
  disconnectChannel as disconnectExistingChannel,
  reconnectChannel as reconnectExistingChannel,
  getPricingRules as fetchPricingRules,
  createPricingRule as addPricingRule,
  updatePricingRule as updateExistingRule,
  deletePricingRule as removePricingRule,
  togglePricingRule as toggleExistingRule,
  recalculatePrices as recalculatePricingEngine,
  getPricingHistory as fetchPricingHistory,
  getSyncLogs as fetchSyncLogs,
  getStatistics as fetchStatistics,
  getOccupancyHistory as fetchOccupancyHistory
} from '../utils/db.js';

export const healthCheck = async (req, res) => {
  try {
    const stats = await fetchStatistics();
    res.json({ status: 'ok', statistics: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listRooms = async (req, res) => {
  try {
    const rooms = await fetchRooms();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createRoom = async (req, res) => {
  try {
    const room = await addRoom(req.body);
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const room = await updateExistingRoom(req.params.id, req.body);
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const room = await removeRoom(req.params.id);
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAvailability = async (req, res) => {
  try {
    const room = await updateRoomAvailabilityInStore(req.params.id, req.body);
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listBookings = async (req, res) => {
  try {
    const bookings = await fetchBookings();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const booking = await addBooking(req.body);
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const booking = await updateExistingBooking(req.params.id, req.body);
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await cancelExistingBooking(req.params.id);
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const booking = await removeBooking(req.params.id);
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listChannels = async (req, res) => {
  try {
    const channels = await fetchChannels();
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const syncChannel = async (req, res) => {
  try {
    const channel = await runSync(req.params.id);
    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const connectChannel = async (req, res) => {
  try {
    const channel = await connectExistingChannel(req.params.id);
    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const disconnectChannel = async (req, res) => {
  try {
    const channel = await disconnectExistingChannel(req.params.id);
    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const reconnectChannel = async (req, res) => {
  try {
    const channel = await reconnectExistingChannel(req.params.id);
    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listPricingRules = async (req, res) => {
  try {
    const rules = await fetchPricingRules();
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPricingRule = async (req, res) => {
  try {
    const rule = await addPricingRule(req.body);
    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePricingRule = async (req, res) => {
  try {
    const rule = await updateExistingRule(req.params.id, req.body);
    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePricingRule = async (req, res) => {
  try {
    const rule = await removePricingRule(req.params.id);
    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const togglePricingRule = async (req, res) => {
  try {
    const rule = await toggleExistingRule(req.params.id);
    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const recalculatePricing = async (req, res) => {
  try {
    const result = await recalculatePricingEngine(req.body?.reason || 'Manual Recalculation');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listPricingHistory = async (req, res) => {
  try {
    const history = await fetchPricingHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listSyncLogs = async (req, res) => {
  try {
    const logs = await fetchSyncLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listStatistics = async (req, res) => {
  try {
    const stats = await fetchStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listOccupancyHistory = async (req, res) => {
  try {
    const history = await fetchOccupancyHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


