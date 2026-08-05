export type Role = 'HOUSEKEEPER' | 'INSPECTOR' | 'MAINTENANCE_TECH' | 'FRONT_DESK' | 'HOTEL_MANAGER';

export type RoomStatus = 
  | 'CLEAN' 
  | 'DIRTY' 
  | 'CLEANING_IN_PROGRESS' 
  | 'INSPECTION_PENDING' 
  | 'MAINTENANCE_PENDING' 
  | 'OUT_OF_SERVICE';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type IssueCategory = 
  | 'APPLIANCE' 
  | 'PLUMBING' 
  | 'HVAC' 
  | 'PROPERTY_DAMAGE' 
  | 'ELECTRICAL' 
  | 'OTHER';

export type TicketStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'PAUSED' | 'RESOLVED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  phone?: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  roomType: string; // e.g. 'King Suite', 'Double Queen', 'Deluxe King'
  floor: number;
  building: string;
  status: RoomStatus;
  priority: Priority;
  checkoutTime?: string;
  guestCheckoutInfo?: string;
  housekeeperId?: string;
  housekeeperName?: string;
  cleaningStartTime?: string;
  cleaningEndTime?: string;
  cleaningDurationMinutes?: number;
  cleaningNotes?: string;
  lastCleanedAt?: string;
  inspectedBy?: string;
}

export interface MaintenanceTicket {
  id: string;
  ticketNumber: string;
  roomId: string;
  roomNumber: string;
  category: IssueCategory;
  title: string;
  description: string;
  priority: Priority;
  status: TicketStatus;
  reporterName: string;
  reporterRole: Role;
  assignedTechId?: string;
  assignedTechName?: string;
  images: string[];
  completionImages?: string[];
  repairNotes?: string;
  estimatedCompletionTime?: string;
  reportTime: string;
  startedAt?: string;
  completedAt?: string;
  smsSentToTech?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'HOUSEKEEPING_ALERT' | 'MAINTENANCE_ALERT' | 'SMS_SENT' | 'SYSTEM';
  timestamp: string;
  isRead: boolean;
  roomId?: string;
  ticketId?: string;
}

export interface CleaningLog {
  id: string;
  roomId: string;
  roomNumber: string;
  housekeeperName: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  notes?: string;
  statusBefore: RoomStatus;
  statusAfter: RoomStatus;
}
