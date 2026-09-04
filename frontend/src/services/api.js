import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const getModule2Health = () => api.get('/module2/health');
export const getRooms = () => api.get('/module2/rooms');
export const createRoom = (payload) => api.post('/module2/rooms', payload);
export const updateRoom = (id, payload) => api.put(`/module2/rooms/${id}`, payload);
export const deleteRoom = (id) => api.delete(`/module2/rooms/${id}`);
export const updateRoomAvailability = (id, payload) => api.patch(`/module2/rooms/${id}/availability`, payload);

export const getBookings = () => api.get('/module2/bookings');
export const createBooking = (payload) => api.post('/module2/bookings', payload);
export const updateBooking = (id, payload) => api.put(`/module2/bookings/${id}`, payload);
export const cancelBooking = (id) => api.post(`/module2/bookings/${id}/cancel`);
export const deleteBooking = (id) => api.delete(`/module2/bookings/${id}`);

export const getChannels = () => api.get('/module2/channels');
export const syncChannel = (id) => api.post(`/module2/channels/${id}/sync`);
export const connectChannel = (id) => api.post(`/module2/channels/${id}/connect`);
export const disconnectChannel = (id) => api.post(`/module2/channels/${id}/disconnect`);
export const reconnectChannel = (id) => api.post(`/module2/channels/${id}/reconnect`);

export const getPricingRules = () => api.get('/module2/pricing-rules');
export const createPricingRule = (payload) => api.post('/module2/pricing-rules', payload);
export const updatePricingRule = (id, payload) => api.put(`/module2/pricing-rules/${id}`, payload);
export const deletePricingRule = (id) => api.delete(`/module2/pricing-rules/${id}`);
export const togglePricingRule = (id) => api.patch(`/module2/pricing-rules/${id}/toggle`);
export const recalculatePricing = (reason) => api.post('/module2/pricing/recalculate', { reason });

export const getPricingHistory = () => api.get('/module2/pricing-history');
export const getSyncLogs = () => api.get('/module2/sync-logs');
export const getStatistics = () => api.get('/module2/statistics');
export const getOccupancyHistory = () => api.get('/module2/occupancy-history');
// InnKeeper application APIs

export const fetchRooms = () => api.get('/rooms');

export const fetchMaintenance = () => api.get('/maintenance');

export const fetchNotifications = () => api.get('/notifications');

export const startRoomCleaning = (roomId) =>
  api.put(`/rooms/${roomId}/start`);

export const markRoomClean = (roomId, notes) =>
  api.put(`/rooms/${roomId}/clean`, { notes });

export const markRoomDirty = (roomId) =>
  api.put(`/rooms/${roomId}/dirty`);

export const markRoomInspected = (roomId) =>
  api.put(`/rooms/${roomId}/inspect`);

export const createMaintenanceIssue = (payload) =>
  api.post('/maintenance', payload);

export const updateMaintenanceTicket = (ticketId, payload) =>
  api.put(`/maintenance/${ticketId}`, payload);

export const markNotificationAsRead = (id) =>
  api.put('/notifications', { id });

export const clearNotifications = () =>
  api.delete('/notifications');
export default api;
