export function getPanamaTime(): Date {
    // Create a date object with the current time in Panama timezone
    const now = new Date();
    const panamaString = now.toLocaleString("en-US", { timeZone: "America/Panama" });
    return new Date(panamaString);
}

export function isPastHour(hour: number, selectedDateString: string): boolean {
    if (!selectedDateString) return false;

    const panamaNow = getPanamaTime();
    const currentHour = panamaNow.getHours();

    // Parse selected date (which is "YYYY-MM-DD")
    // We treat selectedDateString as a date at 00:00:00 in Panama time roughly to compare days
    // But simplest is to compare YYYY-MM-DD strings

    const [pYear, pMonth, pDay] = [
        panamaNow.getFullYear(),
        String(panamaNow.getMonth() + 1).padStart(2, '0'),
        String(panamaNow.getDate()).padStart(2, '0')
    ];
    const panamaDateString = `${pYear}-${pMonth}-${pDay}`;

    if (selectedDateString < panamaDateString) return true; // Past dates are fully past
    if (selectedDateString > panamaDateString) return false; // Future dates are fully available

    // Same day
    // Rule: if hour <= currentHour, it is not available.
    // e.g. Now 12:00. Slot 12:00 is disabled. Slot 13:00 is enabled.
    return hour <= currentHour;
}
