import express from 'express';

// Auth
import { signup, login, me, logout, forgotPassword, resetPassword } from '../controllers/authController.js';

// Module2 distribution
import {
  healthCheck, listRooms, createRoom, updateRoom, deleteRoom, updateAvailability,
  listBookings, createBooking, updateBooking, cancelBooking, deleteBooking,
  listChannels, syncChannel, connectChannel, disconnectChannel, reconnectChannel,
  listPricingRules, createPricingRule, updatePricingRule, deletePricingRule, togglePricingRule,
  recalculatePricing, listPricingHistory, listSyncLogs, listStatistics, listOccupancyHistory
} from '../controllers/distributionController.js';

// New feature controllers
import {
  listRoomsNew,
  getRoomNew,
  createRoomNew,
  updateRoomNew,
  deleteRoomNew,
  startCleaning,
  markRoomClean,
  markRoomDirty,
  markRoomInspected
} from '../controllers/roomsController.js';
import { listGuests, createGuest, updateGuest, deleteGuest } from '../controllers/guestController.js';
import { listReservations, createReservation, updateReservation, deleteReservation } from '../controllers/reservationController.js';
import { listPayments, getPayment, createPayment, updatePayment, deletePayment } from '../controllers/paymentController.js';
import { listVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle } from '../controllers/vehicleController.js';
import { listCashLedger, createCashLedger, updateCashLedger, deleteCashLedger } from '../controllers/cashLedgerController.js';
import { listShiftAudits, createShiftAudit, updateShiftAudit, deleteShiftAudit } from '../controllers/shiftAuditController.js';
import { listHousekeeping, createHousekeeping, updateHousekeeping } from '../controllers/housekeepingController.js';
import { listMaintenance, createMaintenance, updateMaintenance } from '../controllers/maintenanceController.js';
import {
  listNotifications,
  createNotification,
  markRead,
  clearNotifications
} from '../controllers/notificationController.js';
import { getAnalytics } from '../controllers/analyticsController.js';
import { getDashboard } from '../controllers/dashboardController.js';
import { getWeather } from '../controllers/weatherController.js';
import { getRoomAvailability } from '../controllers/roomAvailabilityController.js';
import { createBookingWithPayment, verifyGuestId, processCheckInPayment, generateDigitalLockKey, unlockDoor, completeGuestCheckIn } from '../controllers/checkinController.js';

const router = express.Router();

// ─── Health ────────────────────────────────────────────────
router.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── Check-In & Digital Lock Key Generation ────────────────
router.post('/checkin/book-with-payment', createBookingWithPayment);
router.post('/checkin/verify-id', verifyGuestId);
router.post('/checkin/process-payment', processCheckInPayment);
router.post('/checkin/generate-lock-key', generateDigitalLockKey);
router.post('/checkin/unlock-door', unlockDoor);
router.post('/checkin/complete', completeGuestCheckIn);

// ─── Auth ──────────────────────────────────────────────────
router.post('/auth/signup', signup);
router.post('/auth/login', login);
router.get('/auth/me', me);
router.post('/auth/logout', logout);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

// ─── Rooms ─────────────────────────────────────────────────
router.get('/rooms', listRoomsNew);
router.get('/rooms/:id', getRoomNew);
router.post('/rooms', createRoomNew);
router.put('/rooms/:id', updateRoomNew);
router.delete('/rooms/:id', deleteRoomNew);
router.put('/rooms/:id/start', startCleaning);

router.put('/rooms/:id/clean', markRoomClean);

router.put('/rooms/:id/dirty', markRoomDirty);

router.put('/rooms/:id/inspect', markRoomInspected);

// ─── Guests ────────────────────────────────────────────────
router.get('/guests', listGuests);
router.post('/guests', createGuest);
router.put('/guests/:id', updateGuest);
router.delete('/guests/:id', deleteGuest);

// ─── Reservations ──────────────────────────────────────────
router.get('/reservations', listReservations);
router.post('/reservations', createReservation);
router.put('/reservations/:id', updateReservation);
router.delete('/reservations/:id', deleteReservation);

// ─── Payments ──────────────────────────────────────────────
router.get('/payments', listPayments);
router.get('/payments/:id', getPayment);
router.post('/payments', createPayment);
router.put('/payments/:id', updatePayment);
router.delete('/payments/:id', deletePayment);

// ─── Vehicles ──────────────────────────────────────────────
router.get('/vehicles', listVehicles);
router.get('/vehicles/:id', getVehicle);
router.post('/vehicles', createVehicle);
router.put('/vehicles/:id', updateVehicle);
router.delete('/vehicles/:id', deleteVehicle);

// ─── Cash Ledger ───────────────────────────────────────────
router.get('/cash-ledger', listCashLedger);
router.post('/cash-ledger', createCashLedger);
router.put('/cash-ledger/:id', updateCashLedger);
router.delete('/cash-ledger/:id', deleteCashLedger);

// ─── Shift Audits ──────────────────────────────────────────
router.get('/shift-audits', listShiftAudits);
router.post('/shift-audits', createShiftAudit);
router.put('/shift-audits/:id', updateShiftAudit);
router.delete('/shift-audits/:id', deleteShiftAudit);

// ─── Housekeeping ──────────────────────────────────────────
router.get('/housekeeping', listHousekeeping);
router.post('/housekeeping', createHousekeeping);
router.put('/housekeeping/:id', updateHousekeeping);

// ─── Maintenance ───────────────────────────────────────────
router.get('/maintenance', listMaintenance);
router.post('/maintenance', createMaintenance);
router.put('/maintenance/:id', updateMaintenance);

// ─── Notifications ─────────────────────────────────────────
router.get('/notifications', listNotifications);
router.post('/notifications', createNotification);
router.post('/notifications/mark-read', markRead);
router.put('/notifications', markRead);

router.delete('/notifications', clearNotifications);

// ─── Analytics / Dashboard ────────────────────────────────
router.get('/analytics', getAnalytics);
router.get('/dashboard', getDashboard);
router.get('/weather', getWeather);
router.get('/room-availability', getRoomAvailability);

// ─── Module2 distribution (existing) ──────────────────────
router.get('/module2/health', healthCheck);
router.get('/module2/rooms', listRooms);
router.post('/module2/rooms', createRoom);
router.put('/module2/rooms/:id', updateRoom);
router.delete('/module2/rooms/:id', deleteRoom);
router.patch('/module2/rooms/:id/availability', updateAvailability);
router.get('/module2/bookings', listBookings);
router.post('/module2/bookings', createBooking);
router.put('/module2/bookings/:id', updateBooking);
router.post('/module2/bookings/:id/cancel', cancelBooking);
router.delete('/module2/bookings/:id', deleteBooking);
router.get('/module2/channels', listChannels);
router.post('/module2/channels/:id/sync', syncChannel);
router.post('/module2/channels/:id/connect', connectChannel);
router.post('/module2/channels/:id/disconnect', disconnectChannel);
router.post('/module2/channels/:id/reconnect', reconnectChannel);
router.get('/module2/pricing-rules', listPricingRules);
router.post('/module2/pricing-rules', createPricingRule);
router.put('/module2/pricing-rules/:id', updatePricingRule);
router.delete('/module2/pricing-rules/:id', deletePricingRule);
router.patch('/module2/pricing-rules/:id/toggle', togglePricingRule);
router.post('/module2/pricing/recalculate', recalculatePricing);
router.post('/module2/pricing-engine/recalculate', recalculatePricing);
router.get('/module2/pricing-history', listPricingHistory);
router.get('/module2/sync-logs', listSyncLogs);
router.get('/module2/statistics', listStatistics);
router.get('/module2/occupancy-history', listOccupancyHistory);

export default router;
