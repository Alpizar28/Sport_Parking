'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type DatePickerProps = {
    selectedDate: string; // YYYY-MM-DD
    onChange: (date: string) => void;
};

export default function DatePicker({ selectedDate, onChange }: DatePickerProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        if (selectedDate) {
            setCurrentMonth(new Date(`${selectedDate}T12:00:00`));
        }
    }, [selectedDate]);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const startDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const days = daysInMonth(year, month);
    const startDay = startDayOfMonth(year, month);

    const todayStr = new Date().toISOString().split('T')[0];

    // Localized Month Names
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const handleDateClick = (day: number) => {
        const m = (month + 1).toString().padStart(2, '0');
        const d = day.toString().padStart(2, '0');
        const newDateStr = `${year}-${m}-${d}`;

        if (newDateStr < todayStr) return; // Disable past
        onChange(newDateStr);
    };

    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));

    return (
        <div className="bg-card border border-border p-4 rounded-xl select-none shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <button onClick={prevMonth} className="p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-bold text-foreground text-lg tracking-tight">
                    {monthNames[month]} {year}
                </span>
                <button onClick={nextMonth} className="p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                    <div key={i} className="py-1">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: days }).map((_, i) => {
                    const day = i + 1;
                    const m = (month + 1).toString().padStart(2, '0');
                    const d = day.toString().padStart(2, '0');
                    const dateStr = `${year}-${m}-${d}`;
                    const isSelected = dateStr === selectedDate;
                    const isToday = dateStr === todayStr;
                    const isPast = dateStr < todayStr;

                    return (
                        <button
                            key={day}
                            onClick={() => handleDateClick(day)}
                            disabled={isPast}
                            className={`
                                h-10 w-10 flex items-center justify-center rounded-xl transition-all font-medium text-sm
                                ${isSelected
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 font-bold'
                                    : isPast
                                        ? 'text-muted-foreground/30 bg-transparent cursor-not-allowed'
                                        : 'text-foreground hover:bg-primary/20 hover:text-primary bg-secondary/30'
                                }
                                ${isToday && !isSelected ? 'ring-2 ring-primary/40 text-primary font-bold' : ''}
                            `}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
