import { isPastHour } from '@/lib/time';

type TimePickerProps = {
    selectedStartHour: number | null;
    duration: number;
    onChange: (hour: number) => void;
    onDurationChange: (duration: number) => void;
    busyHours: number[];
    selectedDate: string;
    slotStatuses?: Record<number, 'AVAILABLE' | 'HOLD' | 'CONFIRMED'>;
};

export default function TimePicker({ selectedStartHour, duration, onChange, onDurationChange, busyHours, selectedDate, slotStatuses }: TimePickerProps) {
    const hours = Array.from({ length: 16 }, (_, i) => i + 8); // 8 to 23

    return (
        <div className="bg-card border border-border p-6 space-y-6 rounded-xl shadow-sm">
            {/* Legend */}
            <div className="flex gap-4 mb-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest justify-center sm:justify-start">
                <div className="flex items-center gap-1.5 text-emerald-500">
                    <span className="w-2.5 h-2.5 bg-emerald-500/20 border border-emerald-500 rounded-full"></span>
                    Disponible
                </div>
                <div className="flex items-center gap-1.5 text-amber-500">
                    <span className="w-2.5 h-2.5 bg-amber-500/20 border border-amber-500 rounded-full"></span>
                    En Revisión
                </div>
                <div className="flex items-center gap-1.5 text-red-500">
                    <span className="w-2.5 h-2.5 bg-red-500/20 border border-red-500 rounded-full"></span>
                    Reservada
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">Hora de Inicio</label>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {hours.map(hour => {
                        // Priority: slotStatuses > busyHours (legacy)
                        let status: 'AVAILABLE' | 'HOLD' | 'CONFIRMED' = 'AVAILABLE';

                        if (slotStatuses && slotStatuses[hour]) {
                            status = slotStatuses[hour];
                        } else if (busyHours.includes(hour)) {
                            status = 'CONFIRMED';
                        }

                        const isPast = isPastHour(hour, selectedDate);

                        // Interaction Rules
                        const isAvailable = status === 'AVAILABLE' && !isPast;
                        const isSelected = selectedStartHour === hour;
                        const isDisabled = !isAvailable;

                        // Color Styles
                        let colorClass = '';

                        if (isSelected) {
                            colorClass = 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 scale-105 z-10';
                        } else if (isPast) {
                            // Past hour style (disabled gray)
                            colorClass = 'bg-muted border-transparent text-muted-foreground/30 cursor-not-allowed decoration-destructive line-through opacity-50';
                        } else if (status === 'CONFIRMED') {
                            colorClass = 'bg-red-500/10 border-red-500/20 text-red-500 cursor-not-allowed';
                        } else if (status === 'HOLD') {
                            colorClass = 'bg-amber-500/10 border-amber-500/20 text-amber-500 cursor-not-allowed';
                        } else {
                            // Available (Green-ish default or secondary)
                            colorClass = 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:shadow-[0_0_10px_-5px_rgba(16,185,129,0.3)]';
                        }

                        return (
                            <button
                                key={hour}
                                onClick={() => onChange(hour)}
                                disabled={isDisabled}
                                className={`
                                    py-2 px-1 rounded-lg text-sm font-semibold transition-all border
                                    ${colorClass}
                                `}
                            >
                                {hour}:00
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className={`transition-all duration-300 ${selectedStartHour !== null ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                <label className="block text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">Duración</label>
                <div className="flex gap-3 overflow-x-auto pb-1">
                    {[1, 2, 3, 4].map(dur => {
                        const isSelected = duration === dur;
                        const endHour = (selectedStartHour || 0) + dur;

                        return (
                            <button
                                key={dur}
                                onClick={() => onDurationChange(dur)}
                                className={`
                                    flex-1 min-w-[80px] py-3 rounded-lg font-bold text-sm transition-all border
                                    ${isSelected
                                        ? 'bg-accent border-accent text-accent-foreground shadow-md shadow-accent/20 scale-105'
                                        : 'bg-secondary border-border text-foreground hover:bg-secondary/80'
                                    }
                                `}
                            >
                                {dur} h
                                <span className="block text-[10px] opacity-80 font-normal">
                                    {(selectedStartHour || 0)}:00 - {endHour}:00
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
