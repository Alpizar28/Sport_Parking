'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DateNav from '@/components/admin/calendar/DateNav';
import CalendarGrid from '@/components/admin/calendar/CalendarGrid';

export default function AdminCalendarPage() {
    // State
    const [date, setDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [resources, setResources] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [error, setError] = useState<string | null>(null);

    // Fetch
    async function fetchData() {
        setLoading(true);
        setError(null);

        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const res = await fetch(`/api/admin/calendar?date=${dateStr}`);

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    setError("No tienes permiso para ver esto.");
                } else {
                    setError("Error cargando el calendario.");
                }
                return;
            }

            const data = await res.json();
            setResources(data.resources || []);
            setReservations(data.reservations || []);

        } catch (e: any) {
            console.error(e);
            setError("Error de conexión.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
        // Simple "debounce" could be nice but not strictly required since date changes are discrete clicks
    }, [date]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
                        Calendario
                    </h1>
                    <p className="text-neutral-400 text-sm">
                        Visualiza la ocupación por horas y canchas.
                    </p>
                </div>

                <DateNav
                    date={date}
                    onDateChange={setDate}
                    onRefresh={fetchData}
                    loading={loading}
                />
            </div>

            {/* Error Banner */}
            {error && (
                <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 flex items-center gap-3">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Grid */}
            <CalendarGrid
                date={date}
                resources={resources}
                reservations={reservations}
                loading={loading}
            />
        </div>
    );
}
