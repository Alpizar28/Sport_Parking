export const formatTime = (date: string | Date | number): string => {
    if (!date) return '';
    const d = new Date(date);

    // Force specific timezone and 24h format to prevent hydration errors
    return new Intl.DateTimeFormat("es-PA", {
        timeZone: "America/Panama",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
    }).format(d);
};

export const formatDate = (date: string | Date | number): string => {
    if (!date) return '';
    const d = new Date(date);

    return new Intl.DateTimeFormat("es-PA", {
        timeZone: "America/Panama",
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(d);
};

export const formatShortDate = (date: string | Date | number): string => {
    if (!date) return '';
    const d = new Date(date);

    return new Intl.DateTimeFormat("es-PA", {
        timeZone: "America/Panama",
        day: "numeric",
        month: "short"
    }).format(d);
};

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-PA", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2
    }).format(amount);
};
