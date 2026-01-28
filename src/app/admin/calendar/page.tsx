'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DateNav from '@/components/admin/calendar/DateNav';
import CalendarGrid from '@/components/admin/calendar/CalendarGrid';

export default function AdminCalendarPage() {
    // State
    const [date, setDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [resources, setResources] = useState<any[]>([]);
    const [reservations, setReservations] = useState<any[]>([]);
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
            // Filter safe
            const fields = (data.resources || []).filter((r: any) => r.type === 'FIELD');
            setResources(fields);
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

            {/* Toolbar */}
            <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex flex-col md:flex-row gap-6 items-center justify-between backdrop-blur-sm sticky top-0 z-30 shadow-2xl">
                <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                    <button
                        className="px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider bg-primary text-black shadow-lg"
                    >
                        Canchas
                    </button>
                </div>

                {/* Counter */}
                <div className="text-xs text-neutral-500 font-mono">
                    Mostrando <span className="text-white font-bold">{resources.length}</span> canchas
                </div>
            </div>

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
