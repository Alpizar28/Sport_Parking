import { useMemo } from 'react';

interface Resource {
    id: string;
    name: string;
    type: string;
}

interface Reservation {
    id: string;
    start: string;
    end: string;
    status: string;
    resourceIds: string[];
}

interface CalendarGridProps {
    date: Date;
    resources: Resource[];
    reservations: Reservation[];
    loading: boolean;
}

// Hours configuration
const START_HOUR = 8;
const END_HOUR = 23;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

export default function CalendarGrid({ date, resources, reservations, loading }: CalendarGridProps) {

    // Memoized Grid Data
    const gridMap = useMemo(() => {
        const map = new Map<string, Reservation | null>(); // key: "resId-hour" -> Reservation

        console.log("DEBUG GRID: Resources", resources.length, "Reservations", reservations.length);
        if (reservations.length > 0) console.log("First Res:", reservations[0]);

        reservations.forEach(res => {
            const start = new Date(res.start);
            const end = new Date(res.end);

            // Get hours in local time (assuming admin is in correct timezone)
            const startH = start.getHours();
            // If it ends exactly at e.g. 10:00, the last occupied slot is 09:00.
            // If it ends at 10:30, 10:00 is occupied.
            // Simplified: loop from startH to endH - 1 (if clean hours)

            // Handle edge case: reservation spans multiple days or starts before 8am
            // We only care about hours within our view (8-23)

            // Simple robust check: iterate all grid hours
            HOURS.forEach(h => {
                // Construct "Slot" time range for this specific day
                const slotStart = new Date(date);
                slotStart.setHours(h, 0, 0, 0);

                const slotEnd = new Date(date);
                slotEnd.setHours(h + 1, 0, 0, 0);

                // Overlap Check (Max(StartA, StartB) < Min(EndA, EndB))
                if (Math.max(start.getTime(), slotStart.getTime()) < Math.min(end.getTime(), slotEnd.getTime())) {

                    // Mark for each resource involved
                    res.resourceIds.forEach(resId => {
                        const key = `${resId}-${h}`;
                        const existing = map.get(key);

                        // Priority: CONFIRMED(3) > PAYMENT_PENDING(2) > HOLD(1)
                        // If no existing, set it.
                        // If existing is CONFIRMED, keep it (never overwrite confirmed).
                        // If new is CONFIRMED, overwrite anything not confirmed.
                        // If new is PENDING, overwrite HOLD only.

                        let shouldUpdate = false;

                        if (!existing) {
                            shouldUpdate = true;
                        } else {
                            if (existing.status === 'CONFIRMED') {
                                shouldUpdate = false; // King of the hill
                            } else if (res.status === 'CONFIRMED') {
                                shouldUpdate = true; // New king
                            } else if (res.status === 'PAYMENT_PENDING' && existing.status === 'HOLD') {
                                shouldUpdate = true; // Pending beats Hold
                            }
                        }

                        if (shouldUpdate) {
                            map.set(key, res);
                        }
                    });
                }
            });
        });

        return map;
    }, [date, reservations, resources]); // resources dependency mainly for safety if IDs change

    if (loading) {
        return (
            <div className="w-full h-[400px] flex items-center justify-center border border-white/5 rounded-xl bg-neutral-900/20">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-neutral-500 animate-pulse">Cargando disponibilidad...</span>
                </div>
            </div>
        );
    }

    if (resources.length === 0) {
        return <div className="p-8 text-center text-neutral-500">No hay recursos configurados.</div>;
    }

    return (
        <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/50 backdrop-blur-sm shadow-xl">
            <div className="overflow-x-auto pb-2 custom-scrollbar">
                <div className="min-w-[800px]">
                    {/* Header */}
                    <div className="grid border-b border-neutral-800 bg-neutral-950/50 sticky top-0 z-10"
                        style={{ gridTemplateColumns: `auto repeat(${resources.length}, 1fr)` }}
                    >
                        {/* Corner */}
                        <div className="p-4 w-20 border-r border-neutral-800 bg-neutral-950 sticky left-0 z-20">
                            <span className="text-xs font-bold text-neutral-600 uppercase">Hora</span>
                        </div>

                        {/* Resource Columns */}
                        {resources.map(res => (
                            <div key={res.id} className="p-4 text-center border-r border-neutral-800/50 min-w-[120px]">
                                <div className="font-bold text-sm text-neutral-200 truncate">{res.name}</div>
                                <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{res.type}</div>
                            </div>
                        ))}
                    </div>

                    {/* Grid Body */}
                    <div className="divide-y divide-neutral-800/50">
                        {HOURS.map(h => (
                            <div key={h} className="grid hover:bg-white/[0.02] transition-colors group"
                                style={{ gridTemplateColumns: `auto repeat(${resources.length}, 1fr)` }}
                            >
                                {/* Time Label */}
                                <div className="p-3 w-20 border-r border-neutral-800 z-10 sticky left-0 bg-neutral-900 group-hover:bg-neutral-800/80 transition-colors flex items-center justify-center">
                                    <span className="text-xs font-mono text-neutral-500">{h.toString().padStart(2, '0')}:00</span>
                                </div>

                                {/* Cells */}
                                {resources.map(res => {
                                    const key = `${res.id}-${h}`;
                                    const reservation = gridMap.get(key);

                                    // Determine Cell Style
                                    let cellClass = "bg-emerald-500/5 border-emerald-500/10 text-emerald-700/0 hover:text-emerald-500"; // Default Available
                                    let label = "Disponible";
                                    let statusDot = null;

                                    if (reservation) {
                                        if (reservation.status === 'CONFIRMED') {
                                            cellClass = "bg-red-500/20 border-red-500/30 text-white cursor-pointer hover:bg-red-500/30";
                                            label = "Reservado";
                                            statusDot = "bg-red-500";
                                        } else {
                                            // HOLD or PAYMENT_PENDING
                                            cellClass = "bg-amber-500/20 border-amber-500/30 text-white cursor-pointer hover:bg-amber-500/30";
                                            label = "Pendiente";
                                            statusDot = "bg-amber-500";
                                        }
                                    }

                                    return (
                                        <div key={key} className={`
                                            p-2 border-r border-neutral-800/30 h-14 transition-all relative
                                            flex flex-col justify-center items-center gap-1
                                            ${cellClass}
                                        `}>
                                            {reservation ? (
                                                <>
                                                    <div className={`w-2 h-2 rounded-full ${statusDot} shadow-[0_0_8px_currentColor]`} />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
                                                </>
                                            ) : (
                                                <div className="opacity-0 group-hover:opacity-100 text-[10px] text-emerald-500/50 font-medium tracking-widest uppercase transition-opacity">
                                                    Libre
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend footer */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-950/30 flex gap-6 text-xs justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500/10 border border-emerald-500/20 rounded-sm" />
                    <span className="text-neutral-400">Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500/20 border border-amber-500/30 rounded-sm" />
                    <span className="text-neutral-300">Pendiente / Hold</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500/20 border border-red-500/30 rounded-sm" />
                    <span className="text-neutral-300">Confirmado</span>
                </div>
            </div>
        </div>
    );
}
