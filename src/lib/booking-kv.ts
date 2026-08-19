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
  try {
    const settings = await kv.get<RestaurantSettings>('settings:restaurant');
    return settings || DEFAULT_SETTINGS;
  } catch (e) {
    console.warn("Error reading restaurant settings from KV:", e);
    return DEFAULT_SETTINGS;
  }
}

export async function saveRestaurantSettings(settings: RestaurantSettings): Promise<void> {
  try {
    await kv.set('settings:restaurant', settings);
  } catch (e) {
    console.error("Error saving restaurant settings to KV:", e);
  }
}

export async function getWeeklyTemplates(): Promise<WeeklyServiceTemplate[]> {
  try {
    const templates = await kv.get<WeeklyServiceTemplate[]>('template:weekly');
    return templates || DEFAULT_WEEKLY_TEMPLATES;
  } catch (e) {
    console.warn("Error reading weekly templates from KV:", e);
    return DEFAULT_WEEKLY_TEMPLATES;
  }
}

export async function saveWeeklyTemplates(templates: WeeklyServiceTemplate[]): Promise<void> {
  try {
    await kv.set('template:weekly', templates);
  } catch (e) {
    console.error("Error saving weekly templates to KV:", e);
  }
}

export async function getDateOverride(date: string): Promise<DateServiceOverride | null> {
  try {
    return await kv.get<DateServiceOverride>(`override:date:${date}`);
  } catch (e) {
    console.warn(`Error reading date override for ${date}:`, e);
    return null;
  }
}

export async function saveDateOverride(override: DateServiceOverride): Promise<void> {
  try {
    await kv.set(`override:date:${override.date}`, override);
  } catch (e) {
    console.error(`Error saving date override for ${override.date}:`, e);
  }
}

export async function deleteDateOverride(date: string): Promise<void> {
  try {
    await kv.del(`override:date:${date}`);
  } catch (e) {
    console.error(`Error deleting date override for ${date}:`, e);
  }
}

export async function getBookingsByDate(date: string): Promise<Reservation[]> {
  try {
    const bookings = await kv.get<Reservation[]>(`bookings:date:${date}`);
    return bookings || [];
  } catch (e) {
    console.warn(`Error reading bookings for ${date}:`, e);
    return [];
  }
}

export async function saveBookingsForDate(date: string, bookings: Reservation[]): Promise<void> {
  try {
    await kv.set(`bookings:date:${date}`, bookings);
    await kv.sadd('booking_dates', date);
  } catch (e) {
    console.error(`Error saving bookings for ${date}:`, e);
  }
}

export async function getBlockedCapacities(date: string): Promise<BlockedCapacity[]> {
  try {
    const blocks = await kv.get<BlockedCapacity[]>(`blocks:date:${date}`);
    return blocks || [];
  } catch (e) {
    console.warn(`Error reading blocked capacities for ${date}:`, e);
    return [];
  }
}

export async function saveBlockedCapacities(date: string, blocks: BlockedCapacity[]): Promise<void> {
  try {
    await kv.set(`blocks:date:${date}`, blocks);
  } catch (e) {
    console.error(`Error saving blocked capacities for ${date}:`, e);
  }
}
