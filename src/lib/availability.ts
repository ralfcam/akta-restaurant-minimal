import { format, parseISO, getDay, addMinutes, isValid } from 'date-fns';
import { 
  getRestaurantSettings, 
  getWeeklyTemplates, 
  getDateOverride, 
  getBookingsByDate, 
  getBlockedCapacities 
} from './booking-kv';
import { 
  Reservation, 
  WeeklyServiceTemplate, 
  DateServiceOverride, 
  RestaurantSettings 
} from './types/booking';

export type AvailabilityStatus = 
  | 'auto_confirm' 
  | 'manual_approval' 
  | 'phone_only' 
  | 'fully_booked' 
  | 'closed'
  | 'invalid_request';

export interface AvailabilityResult {
  isBookable: boolean;
  statusType: AvailabilityStatus;
  availableSlots: string[];
  suggestedTable?: { label: string, capacity: number }; // internal
  reason?: string; // internal
  isClosed: boolean;
  usesDateOverride: boolean;
  remainingCapacitySummary?: { totalTables: number, availableTables: number, maxPartySize: number };
}

export async function calculateAvailability(
  dateStr: string, // YYYY-MM-DD
  serviceName: string, // e.g. "Dinner"
  partySize: number
): Promise<AvailabilityResult> {
  const settings = await getRestaurantSettings();
  
  if (partySize >= settings.phoneOnlyMinGuests) {
    return {
      isBookable: false,
      statusType: 'phone_only',
      availableSlots: [],
      isClosed: false,
      usesDateOverride: false,
      reason: 'Party size requires phone booking'
    };
  }

  const dateObj = parseISO(dateStr);
  if (!isValid(dateObj)) {
    return {
      isBookable: false,
      statusType: 'invalid_request',
      availableSlots: [],
      isClosed: false,
      usesDateOverride: false,
      reason: 'Invalid date format'
    };
  }
  
  const dayOfWeek = getDay(dateObj); // 0=Sun, 1=Mon...

  // 1. Get templates
  const weeklyTemplates = await getWeeklyTemplates();
  const defaultTemplate = weeklyTemplates.find(t => t.weekday === dayOfWeek && t.serviceName === serviceName);
  const override = await getDateOverride(dateStr);

  const activeSetup = override 
    ? (override.serviceName === serviceName ? override : null)
    : defaultTemplate;

  const isOverride = !!override;

  if (!activeSetup || !activeSetup.isOpen) {
    return {
      isBookable: false,
      statusType: 'closed',
      availableSlots: [],
      isClosed: true,
      usesDateOverride: isOverride,
      reason: 'Restaurant is closed on this date/service'
    };
  }

  // Generate arrival slots
  const availableSlots: string[] = [];
  let currentSlot = parseISO(`${dateStr}T${activeSetup.firstArrivalTime}:00`);
  const endSlot = parseISO(`${dateStr}T${activeSetup.lastArrivalTime}:00`);
  
  while (currentSlot <= endSlot) {
    availableSlots.push(format(currentSlot, 'HH:mm'));
    currentSlot = addMinutes(currentSlot, activeSetup.slotIntervalMinutes);
  }

  // Generate Table Inventory
  let tableInventory: { label: string, capacity: number, isAvailable: boolean }[] = [];
  
  if (activeSetup) {
    activeSetup.tables.forEach((t) => {
      for (let i = 0; i < t.tableCount; i++) {
        tableInventory.push({
          label: `T${t.tableCapacity}-${i+1}`,
          capacity: t.tableCapacity,
          isAvailable: true
        });
      }
    });
  }

  // Remove Occupied Tables
  const bookings = await getBookingsByDate(dateStr);
  const confirmedBookings = bookings.filter(b => 
    (b.status === 'confirmed' || b.status === 'pending') && b.assigned_table_label
  );
  
  // Tables are blocked for the WHOLE service.
  confirmedBookings.forEach(b => {
    const tableIndex = tableInventory.findIndex(t => t.label === b.assigned_table_label && t.isAvailable);
    if (tableIndex !== -1) {
      tableInventory[tableIndex].isAvailable = false;
    }
  });

  // Check manual blocks
  const blocks = await getBlockedCapacities(dateStr);
  blocks.forEach(block => {
    if (block.tableLabel) {
      const tableIndex = tableInventory.findIndex(t => t.label === block.tableLabel && t.isAvailable);
      if (tableIndex !== -1) {
        tableInventory[tableIndex].isAvailable = false;
      }
    }
  });

  const availableTables = tableInventory.filter(t => t.isAvailable);
  availableTables.sort((a, b) => a.capacity - b.capacity);

  // Find smallest suitable table
  let suggestedTable: { label: string, capacity: number } | undefined;
  
  for (const table of availableTables) {
    if (table.capacity >= partySize) {
      // Check waste constraint
      if (table.capacity - partySize <= settings.maximumCapacityWaste || settings.allowLargerTableAssignment) {
        suggestedTable = table;
        break;
      }
    }
  }

  if (!suggestedTable) {
    return {
      isBookable: false,
      statusType: 'fully_booked',
      availableSlots: [],
      isClosed: false,
      usesDateOverride: isOverride,
      remainingCapacitySummary: {
        totalTables: tableInventory.length,
        availableTables: availableTables.length,
        maxPartySize: availableTables.length > 0 ? availableTables[availableTables.length - 1].capacity : 0
      }
    };
  }

  // Determine status type
  let statusType: AvailabilityStatus = 'auto_confirm';
  if (partySize >= settings.manualApprovalMinGuests) {
    statusType = 'manual_approval';
  }

  return {
    isBookable: true,
    statusType,
    availableSlots,
    suggestedTable,
    isClosed: false,
    usesDateOverride: isOverride,
    remainingCapacitySummary: {
      totalTables: tableInventory.length,
      availableTables: availableTables.length,
      maxPartySize: availableTables[availableTables.length - 1].capacity
    }
  };
}
