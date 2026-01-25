'use client';

type TimePickerProps = {
    selectedStartHour: number | null;
    duration: number;
    onChange: (hour: number) => void;
    onDurationChange: (duration: number) => void;
    busyHours: number[];
};

export default function TimePicker({ selectedStartHour, duration, onChange, onDurationChange, busyHours }: TimePickerProps) {
    const hours = Array.from({ length: 16 }, (_, i) => i + 8); // 8 to 23

    return (
        <div className="bg-card border border-border p-6 space-y-6 rounded-xl shadow-sm">
            <div>
                <label className="block text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">Hora de Inicio</label>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {hours.map(hour => {
                        const isBusy = busyHours.includes(hour);
                        const isSelected = selectedStartHour === hour;

                        return (
                            <button
                                key={hour}
                                onClick={() => onChange(hour)}
                                disabled={isBusy}
                                className={`
                                    py-2 px-1 rounded-lg text-sm font-semibold transition-all border
                                    ${isSelected
                                        ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20'
                                        : isBusy
                                            ? 'bg-muted border-transparent text-muted-foreground/50 cursor-not-allowed decoration-destructive line-through'
                                            : 'bg-secondary border-border text-foreground hover:border-primary/50 hover:text-primary hover:shadow-sm'
                                    }
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
