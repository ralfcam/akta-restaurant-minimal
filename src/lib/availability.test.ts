import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateAvailability } from './availability';
import * as bookingKv from './booking-kv';

// Mock the booking-kv module
vi.mock('./booking-kv', () => ({
  getRestaurantSettings: vi.fn(),
  getWeeklyTemplates: vi.fn(),
  getDateOverride: vi.fn(),
  getBookingsByDate: vi.fn(),
  getBlockedCapacities: vi.fn(),
}));

describe('calculateAvailability', () => {
  const defaultSettings = {
    restaurantName: "Äkta Restaurant",
    phoneNumber: "+41 00 000 00 00",
    notificationEmail: "contact@test.com",
    timezone: "Europe/Zurich",
    autoConfirmMaxGuests: 5,
    manualApprovalMinGuests: 6,
    phoneOnlyMinGuests: 7,
    allowLargerTableAssignment: false,
    maximumCapacityWaste: 1,
    tableBlockedForWholeService: true
  };

  const defaultTemplates = [
    { weekday: 0, serviceName: "Dinner", isOpen: false, firstArrivalTime: "18:00", lastArrivalTime: "21:30", slotIntervalMinutes: 30, tables: [] }, // Sunday
    { weekday: 1, serviceName: "Dinner", isOpen: false, firstArrivalTime: "18:00", lastArrivalTime: "21:30", slotIntervalMinutes: 30, tables: [] }, // Monday
    { weekday: 5, serviceName: "Dinner", isOpen: true, firstArrivalTime: "18:00", lastArrivalTime: "21:30", slotIntervalMinutes: 30, tables: [ // Friday
        { tableCapacity: 2, tableCount: 2 },
        { tableCapacity: 3, tableCount: 1 },
        { tableCapacity: 4, tableCount: 1 }
    ]}
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(bookingKv.getRestaurantSettings).mockResolvedValue(defaultSettings);
    vi.mocked(bookingKv.getWeeklyTemplates).mockResolvedValue(defaultTemplates);
    vi.mocked(bookingKv.getDateOverride).mockResolvedValue(null);
    vi.mocked(bookingKv.getBookingsByDate).mockResolvedValue([]);
    vi.mocked(bookingKv.getBlockedCapacities).mockResolvedValue([]);
  });

  it('Sunday dates in 2026 are closed by default', async () => {
    // 2026-07-05 is a Sunday
    const res = await calculateAvailability('2026-07-05', 'Dinner', 2);
    expect(res.isClosed).toBe(true);
    expect(res.statusType).toBe('closed');
  });

  it('Monday dates in 2026 are closed by default', async () => {
    // 2026-07-06 is a Monday
    const res = await calculateAvailability('2026-07-06', 'Dinner', 2);
    expect(res.isClosed).toBe(true);
  });

  it('Sunday dates in 2027 are closed by default', async () => {
    // 2027-07-04 is a Sunday
    const res = await calculateAvailability('2027-07-04', 'Dinner', 2);
    expect(res.isClosed).toBe(true);
  });

  it('A date-specific override can open a normally closed Sunday', async () => {
    vi.mocked(bookingKv.getDateOverride).mockResolvedValue({
      date: '2026-07-05',
      serviceName: 'Dinner',
      isOpen: true,
      firstArrivalTime: '18:00',
      lastArrivalTime: '21:00',
      slotIntervalMinutes: 30,
      tables: [{ tableLabel: 'T2-1', tableCapacity: 2, tableCount: 1, isActive: true, isBlocked: false }] as any
    });

    const res = await calculateAvailability('2026-07-05', 'Dinner', 2);
    expect(res.isClosed).toBe(false);
    expect(res.isBookable).toBe(true);
    expect(res.usesDateOverride).toBe(true);
  });

  it('A party of 2 is assigned to a table of 2 when available', async () => {
    // 2026-07-03 is a Friday
    const res = await calculateAvailability('2026-07-03', 'Dinner', 2);
    expect(res.isBookable).toBe(true);
    expect(res.suggestedTable?.capacity).toBe(2);
    expect(res.statusType).toBe('auto_confirm');
  });

  it('A party of 3 is assigned to a table of 3 when available', async () => {
    const res = await calculateAvailability('2026-07-03', 'Dinner', 3);
    expect(res.isBookable).toBe(true);
    expect(res.suggestedTable?.capacity).toBe(3);
  });

  it('A party of 3 can be assigned to a table of 4 if larger table assignment is allowed', async () => {
    vi.mocked(bookingKv.getRestaurantSettings).mockResolvedValue({
      ...defaultSettings,
      allowLargerTableAssignment: true,
      maximumCapacityWaste: 1
    });
    // Remove the table of 3
    vi.mocked(bookingKv.getWeeklyTemplates).mockResolvedValue([
      { weekday: 5, serviceName: "Dinner", isOpen: true, firstArrivalTime: "18:00", lastArrivalTime: "21:30", slotIntervalMinutes: 30, tables: [
          { tableCapacity: 2, tableCount: 2 },
          { tableCapacity: 4, tableCount: 1 }
      ]}
    ] as any);

    const res = await calculateAvailability('2026-07-03', 'Dinner', 3);
    expect(res.isBookable).toBe(true);
    expect(res.suggestedTable?.capacity).toBe(4);
  });

  it('A party of 2 does not consume a table of 6 unless explicitly allowed', async () => {
    // Only table 6 is available
    vi.mocked(bookingKv.getWeeklyTemplates).mockResolvedValue([
      { weekday: 5, serviceName: "Dinner", isOpen: true, firstArrivalTime: "18:00", lastArrivalTime: "21:30", slotIntervalMinutes: 30, tables: [
          { tableCapacity: 6, tableCount: 1 }
      ]}
    ] as any);

    const res = await calculateAvailability('2026-07-03', 'Dinner', 2);
    // Waste = 4, max allowed waste = 1, should be fully booked
    expect(res.isBookable).toBe(false);
    expect(res.statusType).toBe('fully_booked');
  });

  it('A party of 5 can be automatically confirmed if a suitable table is available', async () => {
    vi.mocked(bookingKv.getWeeklyTemplates).mockResolvedValue([
      { weekday: 5, serviceName: "Dinner", isOpen: true, firstArrivalTime: "18:00", lastArrivalTime: "21:30", slotIntervalMinutes: 30, tables: [
          { tableCapacity: 5, tableCount: 1 }
      ]}
    ] as any);

    const res = await calculateAvailability('2026-07-03', 'Dinner', 5);
    expect(res.isBookable).toBe(true);
    expect(res.statusType).toBe('auto_confirm');
  });

  it('A party of 6 creates a pending manual approval reservation', async () => {
    vi.mocked(bookingKv.getWeeklyTemplates).mockResolvedValue([
      { weekday: 5, serviceName: "Dinner", isOpen: true, firstArrivalTime: "18:00", lastArrivalTime: "21:30", slotIntervalMinutes: 30, tables: [
          { tableCapacity: 6, tableCount: 1 }
      ]}
    ] as any);

    const res = await calculateAvailability('2026-07-03', 'Dinner', 6);
    expect(res.isBookable).toBe(true);
    expect(res.statusType).toBe('manual_approval');
  });

  it('A party of 7 or more receives the phone-only message', async () => {
    const res = await calculateAvailability('2026-07-03', 'Dinner', 7);
    expect(res.isBookable).toBe(false);
    expect(res.statusType).toBe('phone_only');
  });

  it('A confirmed reservation reduces availability for the whole service', async () => {
    // We have one T2 table. We book it. Then we check for 2 guests again.
    vi.mocked(bookingKv.getWeeklyTemplates).mockResolvedValue([
      { weekday: 5, serviceName: "Dinner", isOpen: true, firstArrivalTime: "18:00", lastArrivalTime: "21:30", slotIntervalMinutes: 30, tables: [
          { tableCapacity: 2, tableCount: 1 }
      ]}
    ] as any);

    vi.mocked(bookingKv.getBookingsByDate).mockResolvedValue([
      {
        id: '123',
        client_name: 'Test',
        client_email: 'test@test.com',
        client_phone: '123',
        booking_date: '2026-07-03',
        booking_time: '18:00', // Arrival at 18:00
        guests: 2,
        status: 'confirmed',
        assigned_table_label: 'T2-1',
        created_at: new Date().toISOString()
      }
    ]);

    // Another customer tries to book at 20:00. Even though it's later, table is blocked for whole service
    const res = await calculateAvailability('2026-07-03', 'Dinner', 2);
    expect(res.isBookable).toBe(false);
    expect(res.statusType).toBe('fully_booked');
  });

  it('A manual admin reservation reduces availability', async () => {
    // Exact same behavior, just simulating manual source
    vi.mocked(bookingKv.getWeeklyTemplates).mockResolvedValue([
      { weekday: 5, serviceName: "Dinner", isOpen: true, firstArrivalTime: "18:00", lastArrivalTime: "21:30", slotIntervalMinutes: 30, tables: [
          { tableCapacity: 2, tableCount: 1 }
      ]}
    ] as any);

    vi.mocked(bookingKv.getBookingsByDate).mockResolvedValue([
      {
        id: '123',
        client_name: 'Test',
        client_email: 'test@test.com',
        client_phone: '123',
        booking_date: '2026-07-03',
        booking_time: '19:00',
        guests: 2,
        status: 'confirmed',
        source: 'admin',
        assigned_table_label: 'T2-1',
        created_at: new Date().toISOString()
      }
    ]);

    const res = await calculateAvailability('2026-07-03', 'Dinner', 2);
    expect(res.isBookable).toBe(false);
  });

  it('A blocked table reduces availability', async () => {
    vi.mocked(bookingKv.getWeeklyTemplates).mockResolvedValue([
      { weekday: 5, serviceName: "Dinner", isOpen: true, firstArrivalTime: "18:00", lastArrivalTime: "21:30", slotIntervalMinutes: 15, tables: [
          { tableCapacity: 2, tableCount: 1 }
      ]}
    ] as any);

    vi.mocked(bookingKv.getBlockedCapacities).mockResolvedValue([
      {
        id: 'block1',
        date: '2026-07-03',
        tableLabel: 'T2-1',
        reason: 'Maintenance',
        createdAt: new Date().toISOString()
      }
    ]);

    const res = await calculateAvailability('2026-07-03', 'Dinner', 2);
    expect(res.isBookable).toBe(false);
  });

  it('Generates 15-minute time slots dynamically from configured booking window', async () => {
    vi.mocked(bookingKv.getWeeklyTemplates).mockResolvedValue([
      { weekday: 5, serviceName: "Dinner", isOpen: true, firstArrivalTime: "20:00", lastArrivalTime: "20:45", slotIntervalMinutes: 15, tables: [
          { tableCapacity: 2, tableCount: 5 }
      ]}
    ] as any);

    const res = await calculateAvailability('2026-07-03', 'Dinner', 2);
    expect(res.isBookable).toBe(true);
    expect(res.slots?.map(s => s.time)).toEqual(['20:00', '20:15', '20:30', '20:45']);
  });

  it('Marks a time slot as unavailable after 2 counted reservations for that slot', async () => {
    vi.mocked(bookingKv.getWeeklyTemplates).mockResolvedValue([
      { weekday: 5, serviceName: "Dinner", isOpen: true, firstArrivalTime: "20:00", lastArrivalTime: "20:45", slotIntervalMinutes: 15, tables: [
          { tableCapacity: 2, tableCount: 5 }
      ]}
    ] as any);

    vi.mocked(bookingKv.getBookingsByDate).mockResolvedValue([
      {
        id: 'b1',
        client_name: 'Client 1',
        client_email: 'c1@test.com',
        client_phone: '123',
        booking_date: '2026-07-03',
        booking_time: '20:15',
        guests: 2,
        status: 'confirmed',
        created_at: new Date().toISOString()
      },
      {
        id: 'b2',
        client_name: 'Client 2',
        client_email: 'c2@test.com',
        client_phone: '456',
        booking_date: '2026-07-03',
        booking_time: '20:15',
        guests: 2,
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ]);

    const res = await calculateAvailability('2026-07-03', 'Dinner', 2);
    expect(res.isBookable).toBe(true);
    const slot2015 = res.slots?.find(s => s.time === '20:15');
    const slot2000 = res.slots?.find(s => s.time === '20:00');

    expect(slot2000?.available).toBe(true);
    expect(slot2015?.available).toBe(false);
    expect(slot2015?.count).toBe(2);
    expect(res.availableSlots).not.toContain('20:15');
    expect(res.availableSlots).toContain('20:00');
  });

  it('Re-enables a slot when a reservation is cancelled or rejected', async () => {
    vi.mocked(bookingKv.getWeeklyTemplates).mockResolvedValue([
      { weekday: 5, serviceName: "Dinner", isOpen: true, firstArrivalTime: "20:00", lastArrivalTime: "20:45", slotIntervalMinutes: 15, tables: [
          { tableCapacity: 2, tableCount: 5 }
      ]}
    ] as any);

    vi.mocked(bookingKv.getBookingsByDate).mockResolvedValue([
      {
        id: 'b1',
        client_name: 'Client 1',
        client_email: 'c1@test.com',
        client_phone: '123',
        booking_date: '2026-07-03',
        booking_time: '20:15',
        guests: 2,
        status: 'confirmed',
        created_at: new Date().toISOString()
      },
      {
        id: 'b2',
        client_name: 'Client 2',
        client_email: 'c2@test.com',
        client_phone: '456',
        booking_date: '2026-07-03',
        booking_time: '20:15',
        guests: 2,
        status: 'cancelled_by_restaurant', // Cancelled!
        created_at: new Date().toISOString()
      }
    ]);

    const res = await calculateAvailability('2026-07-03', 'Dinner', 2);
    const slot2015 = res.slots?.find(s => s.time === '20:15');

    expect(slot2015?.available).toBe(true);
    expect(slot2015?.count).toBe(1);
    expect(res.availableSlots).toContain('20:15');
  });

});
