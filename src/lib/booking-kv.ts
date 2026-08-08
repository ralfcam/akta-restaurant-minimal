import { kv } from '@vercel/kv';
import { 
  RestaurantSettings, 
  WeeklyServiceTemplate, 
  DateServiceOverride, 
  Reservation,
  BlockedCapacity
} from './types/booking';

const DEFAULT_SETTINGS: RestaurantSettings = {
  restaurantName: "Äkta Restaurant",
  phoneNumber: "+41 00 000 00 00",
  notificationEmail: "contact@akta.ch",
  timezone: "Europe/Zurich",
  autoConfirmMaxGuests: 5,
  manualApprovalMinGuests: 6,
  phoneOnlyMinGuests: 7,
  allowLargerTableAssignment: false,
  maximumCapacityWaste: 1,
  tableBlockedForWholeService: true,
  maxReservationsPerSlot: 2
};

const DEFAULT_WEEKLY_TEMPLATES: WeeklyServiceTemplate[] = [
  { weekday: 0, serviceName: "Dinner", isOpen: false, firstArrivalTime: "18:00", lastArrivalTime: "21:30", slotIntervalMinutes: 15, tables: [] },
  { weekday: 1, serviceName: "Dinner", isOpen: false, firstArrivalTime: "18:00", lastArrivalTime: "21:30", slotIntervalMinutes: 15, tables: [] },
  ...[2,3,4,5,6].map(day => ({
    weekday: day,
    serviceName: "Dinner",
    isOpen: true,
    firstArrivalTime: "18:00",
    lastArrivalTime: "21:30",
    slotIntervalMinutes: 15,
    tables: [
      { tableCapacity: 2, tableCount: 5 },
      { tableCapacity: 4, tableCount: 3 },
      { tableCapacity: 6, tableCount: 1 }
    ]
  }))
];

export async function getRestaurantSettings(): Promise<RestaurantSettings> {
  const settings = await kv.get<RestaurantSettings>('settings:restaurant');
  return settings || DEFAULT_SETTINGS;
}

export async function saveRestaurantSettings(settings: RestaurantSettings): Promise<void> {
  await kv.set('settings:restaurant', settings);
}

export async function getWeeklyTemplates(): Promise<WeeklyServiceTemplate[]> {
  const templates = await kv.get<WeeklyServiceTemplate[]>('template:weekly');
  return templates || DEFAULT_WEEKLY_TEMPLATES;
}

export async function saveWeeklyTemplates(templates: WeeklyServiceTemplate[]): Promise<void> {
  await kv.set('template:weekly', templates);
}

export async function getDateOverride(date: string): Promise<DateServiceOverride | null> {
  return await kv.get<DateServiceOverride>(`override:date:${date}`);
}

export async function saveDateOverride(override: DateServiceOverride): Promise<void> {
  await kv.set(`override:date:${override.date}`, override);
}

export async function deleteDateOverride(date: string): Promise<void> {
  await kv.del(`override:date:${date}`);
}

export async function getBookingsByDate(date: string): Promise<Reservation[]> {
  const bookings = await kv.get<Reservation[]>(`bookings:date:${date}`);
  return bookings || [];
}

export async function saveBookingsForDate(date: string, bookings: Reservation[]): Promise<void> {
  await kv.set(`bookings:date:${date}`, bookings);
  await kv.sadd('booking_dates', date);
}

export async function getBlockedCapacities(date: string): Promise<BlockedCapacity[]> {
  const blocks = await kv.get<BlockedCapacity[]>(`blocks:date:${date}`);
  return blocks || [];
}

export async function saveBlockedCapacities(date: string, blocks: BlockedCapacity[]): Promise<void> {
  await kv.set(`blocks:date:${date}`, blocks);
}
