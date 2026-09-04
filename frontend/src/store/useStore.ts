import { create } from 'zustand';
import {
  Room,
  MaintenanceTicket,
  NotificationItem,
  Role,
  RoomStatus,
  Priority,
  IssueCategory,
  CleaningLog,
} from '@/types';
import { realtimeHub } from '@/lib/socketSim';

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
  setActiveView: (
    view: 'housekeeping' | 'maintenance' | 'frontdesk'
  ) => void;
  setFloorFilter: (floor: string) => void;
  setBuildingFilter: (building: string) => void;
  setPriorityFilter: (priority: string) => void;
  setStatusFilter: (status: string) => void;
  setSearchQuery: (query: string) => void;

  // Housekeeping Workflows
  startCleaning: (roomId: string) => Promise<void>;
  pauseCleaning: (roomId: string) => Promise<void>;
  resumeCleaning: (roomId: string) => Promise<void>;
  markRoomClean: (roomId: string, notes?: string) => Promise<void>;
  markRoomDirty: (roomId: string) => Promise<void>;
  markRoomInspected: (roomId: string) => Promise<void>;

  // Maintenance Workflows
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
  completeRepair: (
    ticketId: string,
    notes?: string,
    completionImages?: string[],
    finalRoomStatus?: RoomStatus
  ) => Promise<void>;

  // Notifications
  markNotificationRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  addNotification: (
    notif: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>
  ) => void;

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

  // Role & Filter Switchers
  setActiveRole: (role) => set({ activeRole: role }),

  setActiveView: (view) => set({ activeView: view }),

  setFloorFilter: (floor) => set({
    selectedFloorFilter: floor,
  }),

  setBuildingFilter: (building) => set({
    selectedBuildingFilter: building,
  }),

  setPriorityFilter: (priority) => set({
    selectedPriorityFilter: priority,
  }),

  setStatusFilter: (status) => set({
    selectedStatusFilter: status,
  }),

  setSearchQuery: (query) => set({
    searchQuery: query,
  }),

  // Fetch Rooms from Backend
  fetchRoomsFromDb: async () => {
    try {
      set({ isLoading: true });

      const res = await fetch('/api/rooms');
      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json?.error || `Failed to fetch rooms: ${res.status}`
        );
      }

      if (json.success) {
        set({ rooms: json.data });
      } else if (Array.isArray(json)) {
        set({ rooms: json });
      }
    } catch (err) {
      console.error('Failed to fetch rooms from API:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch Tickets from Backend
  fetchTicketsFromDb: async () => {
    try {
      const res = await fetch('/api/maintenance');
      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json?.error || `Failed to fetch tickets: ${res.status}`
        );
      }

      if (json.success) {
        set({ tickets: json.data });
      } else if (Array.isArray(json)) {
        set({ tickets: json });
      }
    } catch (err) {
      console.error('Failed to fetch tickets from API:', err);
    }
  },

  // Fetch Notifications from Backend
  fetchNotificationsFromDb: async () => {
    try {
      const res = await fetch('/api/notifications');
      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json?.error ||
            `Failed to fetch notifications: ${res.status}`
        );
      }

      const notificationData = json.success
        ? json.data
        : Array.isArray(json)
          ? json
          : [];

      set({
        notifications: notificationData.map((n: any) => ({
          ...n,
          timestamp: new Date(
            n.createdAt || n.timestamp || Date.now()
          ).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        })),
      });
    } catch (err) {
      console.error(
        'Failed to fetch notifications from API:',
        err
      );
    }
  },

  // Start Cleaning
  startCleaning: async (roomId) => {
    try {
      set((state) => ({
        rooms: state.rooms.map((room) =>
          room.id === roomId
            ? {
                ...room,
                status: 'CLEANING_IN_PROGRESS',
                cleaningStartTime: new Date().toISOString(),
              }
            : room
        ),
      }));

      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CLEANING_IN_PROGRESS',
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        const updatedRoom = json.data;

        realtimeHub.emit('room_updated', {
          roomId,
          status: 'CLEANING_IN_PROGRESS',
          roomNumber: updatedRoom?.roomNumber,
        });

        await get().fetchNotificationsFromDb();
      } else if (res.ok && json.id) {
        realtimeHub.emit('room_updated', {
          roomId,
          status: 'CLEANING_IN_PROGRESS',
          roomNumber: json.roomNumber,
        });

        await get().fetchNotificationsFromDb();
      } else {
        await get().fetchRoomsFromDb();
      }
    } catch (err) {
      console.error('API Error in startCleaning:', err);
      await get().fetchRoomsFromDb();
    }
  },

  // Pause Cleaning
  pauseCleaning: async (roomId) => {
    await get().markRoomDirty(roomId);
  },

  // Resume Cleaning
  resumeCleaning: async (roomId) => {
    await get().startCleaning(roomId);
  },

  // Mark Room Clean
  markRoomClean: async (roomId, notes) => {
    try {
      set((state) => ({
        rooms: state.rooms.map((room) =>
          room.id === roomId
            ? {
                ...room,
                status: 'CLEAN',
                cleaningNotes: notes,
              }
            : room
        ),
      }));

      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CLEAN',
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        realtimeHub.emit('room_updated', {
          roomId,
          status: 'CLEAN',
          roomNumber: json.data?.roomNumber,
        });

        await get().fetchRoomsFromDb();
        await get().fetchNotificationsFromDb();
      } else if (res.ok && json.id) {
        realtimeHub.emit('room_updated', {
          roomId,
          status: 'CLEAN',
          roomNumber: json.roomNumber,
        });

        await get().fetchRoomsFromDb();
        await get().fetchNotificationsFromDb();
      } else {
        await get().fetchRoomsFromDb();
      }
    } catch (err) {
      console.error('API Error in markRoomClean:', err);
      await get().fetchRoomsFromDb();
    }
  },

  // Mark Room Dirty
  markRoomDirty: async (roomId) => {
    try {
      set((state) => ({
        rooms: state.rooms.map((room) =>
          room.id === roomId
            ? {
                ...room,
                status: 'DIRTY',
              }
            : room
        ),
      }));

      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'DIRTY',
        }),
      });

      const json = await res.json();

      if (res.ok && (json.success || json.id)) {
        realtimeHub.emit('room_updated', {
          roomId,
          status: 'DIRTY',
          roomNumber: json.data?.roomNumber || json.roomNumber,
        });
      } else {
        await get().fetchRoomsFromDb();
      }
    } catch (err) {
      console.error('API Error in markRoomDirty:', err);
      await get().fetchRoomsFromDb();
    }
  },

  // Mark Room Inspected
  markRoomInspected: async (roomId) => {
    try {
      set((state) => ({
        rooms: state.rooms.map((room) =>
          room.id === roomId
            ? {
                ...room,
                status: 'CLEAN',
              }
            : room
        ),
      }));

      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CLEAN',
        }),
      });

      const json = await res.json();

      if (res.ok && (json.success || json.id)) {
        realtimeHub.emit('room_updated', {
          roomId,
          status: 'CLEAN',
          roomNumber: json.data?.roomNumber || json.roomNumber,
        });
      } else {
        await get().fetchRoomsFromDb();
      }
    } catch (err) {
      console.error('API Error in markRoomInspected:', err);
      await get().fetchRoomsFromDb();
    }
  },

  // Report Maintenance Issue
  reportMaintenanceIssue: async ({
    roomId,
    category,
    title,
    description,
    priority,
    images,
  }) => {
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          category,
          title,
          description,
          priority,
          images,
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        const newTicket = json.data;

        realtimeHub.emit('maintenance_created', newTicket);

        await get().fetchRoomsFromDb();
        await get().fetchTicketsFromDb();
        await get().fetchNotificationsFromDb();
      }
    } catch (err) {
      console.error(
        'API Error in reportMaintenanceIssue:',
        err
      );
    }
  },

  // Accept Maintenance Ticket
  acceptTicket: async (
    ticketId,
    techName = 'Alex Rivera'
  ) => {
    try {
      const res = await fetch(
        `/api/maintenance/${ticketId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'ACCEPT',
            techName,
          }),
        }
      );

      if (res.ok) {
        await get().fetchTicketsFromDb();
      }
    } catch (err) {
      console.error('API Error in acceptTicket:', err);
    }
  },

  // Reject Maintenance Ticket
  rejectTicket: async (ticketId) => {
    try {
      const res = await fetch(
        `/api/maintenance/${ticketId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'REJECT',
          }),
        }
      );

      if (res.ok) {
        await get().fetchTicketsFromDb();
      }
    } catch (err) {
      console.error('API Error in rejectTicket:', err);
    }
  },

  // Start Repair
  startRepair: async (
    ticketId,
    estimatedTime = '1 Hour'
  ) => {
    try {
      const res = await fetch(
        `/api/maintenance/${ticketId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'START',
            estimatedTime,
          }),
        }
      );

      if (res.ok) {
        await get().fetchTicketsFromDb();
      }
    } catch (err) {
      console.error('API Error in startRepair:', err);
    }
  },

  // Pause Repair
  pauseRepair: async (ticketId) => {
    try {
      const res = await fetch(
        `/api/maintenance/${ticketId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'PAUSE',
          }),
        }
      );

      if (res.ok) {
        await get().fetchTicketsFromDb();
      }
    } catch (err) {
      console.error('API Error in pauseRepair:', err);
    }
  },

  // Complete Repair
  completeRepair: async (
    ticketId,
    notes,
    completionImages,
    finalRoomStatus = 'DIRTY'
  ) => {
    try {
      const res = await fetch(
        `/api/maintenance/${ticketId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'COMPLETE',
            notes,
            completionImages,
            finalRoomStatus,
          }),
        }
      );

      if (res.ok) {
        await get().fetchRoomsFromDb();
        await get().fetchTicketsFromDb();
        await get().fetchNotificationsFromDb();
      }
    } catch (err) {
      console.error('API Error in completeRepair:', err);
    }
  },

  // Mark Notification Read
  markNotificationRead: async (id) => {
    try {
      const res = await fetch(
        '/api/notifications/mark-read',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id,
            ids: [id],
          }),
        }
      );

      if (!res.ok) {
        throw new Error(
          `Failed to mark notification as read: ${res.status}`
        );
      }

      set((state) => ({
        notifications: state.notifications.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        ),
      }));
    } catch (err) {
      console.error(
        'API Error in markNotificationRead:',
        err
      );
    }
  },

  // Clear All Notifications
  clearAllNotifications: async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(
          `Failed to clear notifications: ${res.status}`
        );
      }

      set({
        notifications: [],
      });
    } catch (err) {
      console.error(
        'API Error in clearAllNotifications:',
        err
      );
    }
  },

  // Add Notification
  addNotification: (notif) => {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isRead: false,
    };

    set((state) => ({
      notifications: [
        newNotif,
        ...state.notifications,
      ],
    }));
  },

  // Initialize Realtime Sync
  initRealtimeSync: () => {
    get().fetchRoomsFromDb();
    get().fetchTicketsFromDb();
    get().fetchNotificationsFromDb();

    const unsubRoom = realtimeHub.subscribe(
      'room_updated',
      () => {
        get().fetchRoomsFromDb();
        get().fetchNotificationsFromDb();
      }
    );

    const unsubMaint = realtimeHub.subscribe(
      'maintenance_created',
      () => {
        get().fetchRoomsFromDb();
        get().fetchTicketsFromDb();
        get().fetchNotificationsFromDb();
      }
    );

    return () => {
      unsubRoom();
      unsubMaint();
    };
  },
}));