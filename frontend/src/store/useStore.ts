import { create } from 'zustand';
import { Room, MaintenanceTicket, NotificationItem, Role, RoomStatus, Priority, IssueCategory, CleaningLog } from '@/types';
import { realtimeHub } from '@/lib/socketSim';
import {
  fetchRooms,
  fetchMaintenance,
  fetchNotifications,
  startRoomCleaning,
  markRoomClean,
  markRoomDirty,
  markRoomInspected,
  createMaintenanceIssue,
  updateMaintenanceTicket,
  markNotificationAsRead,
  clearNotifications,
} from '@/services/api';

interface AppState {
  activeRole: Role;
  rooms: Room[];
  tickets: MaintenanceTicket[];
  notifications: NotificationItem[];
  cleaningLogs: CleaningLog[];
  activeView: 'housekeeping' | 'maintenance' | 'frontdesk';
  selectedFloorFilter: string;
  selectedBuildingFilter: string;
  selectedPriorityFilter: string;
  selectedStatusFilter: string;
  searchQuery: string;
  isLoading: boolean;

  // DB Sync Actions
  fetchRoomsFromDb: () => Promise<void>;
  fetchTicketsFromDb: () => Promise<void>;
  fetchNotificationsFromDb: () => Promise<void>;

  // Role & Filter Switchers
  setActiveRole: (role: Role) => void;
  setActiveView: (view: 'housekeeping' | 'maintenance' | 'frontdesk') => void;
  setFloorFilter: (floor: string) => void;
  setBuildingFilter: (building: string) => void;
  setPriorityFilter: (priority: string) => void;
  setStatusFilter: (status: string) => void;
  setSearchQuery: (query: string) => void;

  // Housekeeping Workflows (API Driven)
  startCleaning: (roomId: string) => Promise<void>;
  pauseCleaning: (roomId: string) => Promise<void>;
  resumeCleaning: (roomId: string) => Promise<void>;
  markRoomClean: (roomId: string, notes?: string) => Promise<void>;
  markRoomDirty: (roomId: string) => Promise<void>;
  markRoomInspected: (roomId: string) => Promise<void>;

  // Maintenance Workflows (API Driven)
  reportMaintenanceIssue: (data: {
    roomId: string;
    category: IssueCategory;
    title: string;
    description: string;
    priority: Priority;
    images: string[];
  }) => Promise<void>;
  acceptTicket: (ticketId: string, techName?: string) => Promise<void>;
  rejectTicket: (ticketId: string) => Promise<void>;
  startRepair: (ticketId: string, estimatedTime?: string) => Promise<void>;
  pauseRepair: (ticketId: string) => Promise<void>;
  completeRepair: (ticketId: string, notes?: string, completionImages?: string[], finalRoomStatus?: RoomStatus) => Promise<void>;

  // Notifications
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => void;

  initRealtimeSync: () => () => void;
}

export const useStore = create<AppState>((set, get) => ({
  activeRole: 'HOUSEKEEPER',
  rooms: [],
  tickets: [],
  notifications: [],
  cleaningLogs: [],
  activeView: 'housekeeping',
  selectedFloorFilter: 'ALL',
  selectedBuildingFilter: 'ALL',
  selectedPriorityFilter: 'ALL',
  selectedStatusFilter: 'ALL',
  searchQuery: '',
  isLoading: false,

  setActiveRole: (role) => set({ activeRole: role }),
  setActiveView: (view) => set({ activeView: view }),

  setFloorFilter: (floor) => set({ selectedFloorFilter: floor }),
  setBuildingFilter: (building) => set({ selectedBuildingFilter: building }),
  setPriorityFilter: (priority) => set({ selectedPriorityFilter: priority }),
  setStatusFilter: (status) => set({ selectedStatusFilter: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Fetch Rooms from Backend Prisma DB API
  fetchRoomsFromDb: async () => {
    try {
      set({ isLoading: true });
      const response = await fetchRooms();
const json = response.data;
      if (json.success) {
        set({ rooms: json.data });
      }
    } catch (err) {
      console.error('Failed to fetch rooms from API:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch Tickets from Backend Prisma DB API
  fetchTicketsFromDb: async () => {
    try {
      const response = await fetchMaintenance();
const json = response.data;
      if (json.success) {
        set({ tickets: json.data });
      }
    } catch (err) {
      console.error('Failed to fetch tickets from API:', err);
    }
  },

  // Fetch Notifications from Backend Prisma DB API
  fetchNotificationsFromDb: async () => {
    try {
      const response = await fetchNotifications();
const json = response.data;
      if (json.success) {
        set({
          notifications: json.data.map((n: any) => ({
            ...n,
            timestamp: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })),
        });
      }
    } catch (err) {
      console.error('Failed to fetch notifications from API:', err);
    }
  },

  // Start Cleaning Action (Database API Call)
  startCleaning: async (roomId) => {
    try {
      // Optimistic update
      set((state) => ({
        rooms: state.rooms.map((r) =>
          r.id === roomId
            ? { ...r, status: 'CLEANING_IN_PROGRESS', cleaningStartTime: new Date().toISOString() }
            : r
        ),
      }));

      const response = await startRoomCleaning(roomId);
const json = response.data;
      if (json.success) {
        const updatedRoom = json.data;
        realtimeHub.emit('room_updated', {
          roomId,
          status: 'CLEANING_IN_PROGRESS',
          roomNumber: updatedRoom.roomNumber,
        });
        await get().fetchNotificationsFromDb();
      }
    } catch (err) {
      console.error('API Error in startCleaning:', err);
      get().fetchRoomsFromDb();
    }
  },

  pauseCleaning: async (roomId) => {
    await get().markRoomDirty(roomId);
  },

  resumeCleaning: async (roomId) => {
    await get().startCleaning(roomId);
  },

  // Mark Room Clean Action (Database API Call)
  markRoomClean: async (roomId, notes) => {
    try {
      // Optimistic update
      set((state) => ({
        rooms: state.rooms.map((r) =>
          r.id === roomId ? { ...r, status: 'CLEAN', cleaningNotes: notes } : r
        ),
      }));

      const response = await markRoomClean(roomId, notes);
const json = response.data;
      if (json.success) {
        realtimeHub.emit('room_updated', {
          roomId,
          status: 'CLEAN',
          roomNumber: json.data.roomNumber,
        });
        await get().fetchRoomsFromDb();
        await get().fetchNotificationsFromDb();
      }
    } catch (err) {
      console.error('API Error in markRoomClean:', err);
      get().fetchRoomsFromDb();
    }
  },

  markRoomDirty: async (roomId) => {
    try {
      set((state) => ({
        rooms: state.rooms.map((r) => (r.id === roomId ? { ...r, status: 'DIRTY' } : r)),
      }));

      const response = await markRoomDirty(roomId);
const json = response.data;
      if (json.success) {
        realtimeHub.emit('room_updated', { roomId, status: 'DIRTY' });
      }
    } catch (err) {
      get().fetchRoomsFromDb();
    }
  },

  markRoomInspected: async (roomId) => {
    try {
      set((state) => ({
        rooms: state.rooms.map((r) => (r.id === roomId ? { ...r, status: 'CLEAN' } : r)),
      }));

      const response = await markRoomInspected(roomId);
const json = response.data;
      if (json.success) {
        realtimeHub.emit('room_updated', { roomId, status: 'CLEAN' });
      }
    } catch (err) {
      get().fetchRoomsFromDb();
    }
  },

  // Report Maintenance Issue (Database API Transaction)
  reportMaintenanceIssue: async ({ roomId, category, title, description, priority, images }) => {
    try {
      const response = await createMaintenanceIssue({
  roomId,
  category,
  title,
  description,
  priority,
  images,
});

const json = response.data;
      if (json.success) {
        const newTicket = json.data;
        realtimeHub.emit('maintenance_created', newTicket);
        await get().fetchRoomsFromDb();
        await get().fetchTicketsFromDb();
        await get().fetchNotificationsFromDb();
      }
    } catch (err) {
      console.error('API Error in reportMaintenanceIssue:', err);
    }
  },

  acceptTicket: async (ticketId, techName = 'Alex Rivera') => {
    try {
      const response = await updateMaintenanceTicket(ticketId, {
  action: 'ACCEPT',
  techName,
});

if (response.data) {
  await get().fetchTicketsFromDb();
}
    } catch (err) {
      console.error('API Error in acceptTicket:', err);
    }
  },

  rejectTicket: async (ticketId) => {
    try {
      const response = await updateMaintenanceTicket(ticketId, {
  action: 'REJECT',
});

if (response.data) {
  await get().fetchTicketsFromDb();
}
    } catch (err) {
      console.error('API Error in rejectTicket:', err);
    }
  },

  startRepair: async (ticketId, estimatedTime = '1 Hour') => {
    try {
      const response = await updateMaintenanceTicket(ticketId, {
  action: 'START',
  estimatedTime,
});

if (response.data) {
  await get().fetchTicketsFromDb();
}
    } catch (err) {
      console.error('API Error in startRepair:', err);
    }
  },

  pauseRepair: async (ticketId) => {
    try {
      const response = await updateMaintenanceTicket(ticketId, {
  action: 'PAUSE',
});

if (response.data) {
  await get().fetchTicketsFromDb();
}
    } catch (err) {
      console.error('API Error in pauseRepair:', err);
    }
  },

  completeRepair: async (ticketId, notes, completionImages, finalRoomStatus = 'DIRTY') => {
    try {
      const response = await updateMaintenanceTicket(ticketId, {
  action: 'COMPLETE',
  notes,
  completionImages,
  finalRoomStatus,
});

if (response.data) {
  await get().fetchRoomsFromDb();
  await get().fetchTicketsFromDb();
  await get().fetchNotificationsFromDb();
}
    } catch (err) {
      console.error('API Error in completeRepair:', err);
    }
  },

  markNotificationRead: async (id) => {
    try {
      await markNotificationAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      }));
    } catch (err) {
      console.error('API Error in markNotificationRead:', err);
    }
  },

  clearAllNotifications: async () => {
    try {
      await clearNotifications();
      set({ notifications: [] });
    } catch (err) {
      console.error('API Error in clearAllNotifications:', err);
    }
  },

  addNotification: (notif) => {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    };
    set((state) => ({ notifications: [newNotif, ...state.notifications] }));
  },

  initRealtimeSync: () => {
    // Initial DB Fetch
    get().fetchRoomsFromDb();
    get().fetchTicketsFromDb();
    get().fetchNotificationsFromDb();

    const unsubRoom = realtimeHub.subscribe('room_updated', () => {
      get().fetchRoomsFromDb();
      get().fetchNotificationsFromDb();
    });

    const unsubMaint = realtimeHub.subscribe('maintenance_created', () => {
      get().fetchRoomsFromDb();
      get().fetchTicketsFromDb();
      get().fetchNotificationsFromDb();
    });

    return () => {
      unsubRoom();
      unsubMaint();
    };
  },
}));
