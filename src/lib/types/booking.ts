export interface RestaurantSettings {
  restaurantName: string;
  phoneNumber: string;
  notificationEmail: string;
  timezone: string;
  autoConfirmMaxGuests: number;
  manualApprovalMinGuests: number;
  phoneOnlyMinGuests: number;
  allowLargerTableAssignment: boolean;
  maximumCapacityWaste: number;
  tableBlockedForWholeService: boolean;
}

export interface WeeklyTableTemplate {
  tableCapacity: number;
  tableCount: number;
}

export interface WeeklyServiceTemplate {
  weekday: number; // 0=Sun, 1=Mon, ..., 6=Sat
  serviceName: string;
  isOpen: boolean;
  firstArrivalTime: string;
  lastArrivalTime: string;
  slotIntervalMinutes: number;
  tables: WeeklyTableTemplate[];
}

export interface DateTableOverride {
  tableLabel: string;
  tableCapacity: number;
  isActive: boolean;
  isBlocked: boolean;
  blockReason?: string;
}

export interface DateServiceOverride {
  date: string; // YYYY-MM-DD
  serviceName: string;
  isOpen: boolean;
  firstArrivalTime: string;
  lastArrivalTime: string;
  slotIntervalMinutes: number;
  notes?: string;
  tables: DateTableOverride[];
}

export interface Reservation {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  booking_date: string; // YYYY-MM-DD
  booking_time: string; // HH:MM
  guests: number;
  notes?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled_by_customer' | 'cancelled_by_restaurant';
  source?: 'online' | 'admin' | 'phone';
  assigned_table_label?: string;
  assigned_table_capacity?: number;
  created_at: string;
}

export interface BlockedCapacity {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // Optional: whole day or specific time
  tableLabel?: string; // Which table is blocked (if mapped to specific table)
  capacity?: number; // Or just a number of seats blocked
  reason: string;
  internalNotes?: string;
  createdAt: string;
}
