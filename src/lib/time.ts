import { TZ_VENUE } from './constants';

export function getPanamaTime(): Date {
    // Returns current server time as a Date object representing "Now"
    // Note: Date objects in JS are always UTC timestamp underneath.
    return new Date();
}

/**
 * Converts a Local Date+Hour (in Venue TZ) to UTC Range (ISO Strings)
 * Useful for saving reservations.
 */
export function toUtcRangeFromLocal(dateLocal: string, startHour: number, durationHours: number): { startUtc: string, endUtc: string } {
    // dateLocal is "YYYY-MM-DD"
    // startHour is integer (e.g. 17)

    // Construct ISO string with Offset. Panama is UTC-5 (No DST).
    // We can interpret this strictly or dynamic.
    // Dynamic way (robust):
    // 1. Construct a string "YYYY-MM-DDTHH:00:00"
    // 2. We need to tell the Date constructor this is in "America/Panama".
    //    JS Date constructor accepts logical string. Best is to append offset.
    //    But finding offset dynamically without library is tricky.
    //    For Panama, hardcoding -05:00 is safe and standard.

    // Safety check date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateLocal)) throw new Error("Invalid date format");

    const sH = startHour.toString().padStart(2, '0');
    // Create Date from String with explicit Offset for Panama
    const startDate = new Date(`${dateLocal}T${sH}:00:00-05:00`);

    if (isNaN(startDate.getTime())) throw new Error("Invalid Local Date");

    // Calculate End
    const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

    return {
        startUtc: startDate.toISOString(),
        endUtc: endDate.toISOString()
    };
}

/**
 * Returns UTC Start/End for a full day in Venue TZ
 * Useful for querying availability for a "Panama Day".
 */
export function dayBoundsUtc(dateLocal: string): { startUtc: string, endUtc: string } {
    // Start: 00:00:00 Local -> UTC
    const start = new Date(`${dateLocal}T00:00:00-05:00`);
    // End: 23:59:59.999 Local -> UTC
    // Better: Start + 24 hours - 1ms
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);

    return {
        startUtc: start.toISOString(),
        endUtc: end.toISOString()
    };
}

export function isPastHour(hour: number, selectedDateString: string): boolean {
    if (!selectedDateString) return false;

    // Compare against "Now" in Panama
    const now = new Date();
    // Get current Panama parts
    const pDate = new Intl.DateTimeFormat('en-CA', // YYYY-MM-DD
        { timeZone: TZ_VENUE, year: 'numeric', month: '2-digit', day: '2-digit' }
    ).format(now);

    const pHourStr = new Intl.DateTimeFormat('en-GB', // HH (24h)
        { timeZone: TZ_VENUE, hour: '2-digit', hour12: false }
    ).format(now);
    const pHour = parseInt(pHourStr, 10);

    if (selectedDateString < pDate) return true;
    if (selectedDateString > pDate) return false;

    // Same day: if selected hour <= current Panama hour, it's past/current (unavailable for booking start?)
    // Usually you can't book 17:00 if it is 17:15.
    return hour <= pHour;
}
