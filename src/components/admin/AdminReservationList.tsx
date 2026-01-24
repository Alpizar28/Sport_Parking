'use client';

import { useState, useEffect } from 'react';

type Reservation = {
    id: string;
    status: string;
    start_time: string;
    end_time: string;
    total_amount: number;
    profiles?: { email: string };
    payment_status?: string;
};

export default function AdminReservationList() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/reservations?date=${date}`);
            const data = await res.json();
            if (data.reservations) {
                setReservations(data.reservations);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, [date]);

    const handleCancel = async (id: string) => {
        if (!confirm('¿Seguro que deseas cancelar esta reserva?')) return;

        try {
            const res = await fetch(`/api/admin/reservations/${id}/cancel`, { method: 'POST' });
            if (res.ok) {
                fetchReservations(); // Refresh
            } else {
                alert('Error al cancelar');
            }
        } catch (e) {
            alert('Error de red');
        }
    };

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <div className="flex justify-between mb-4">
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white p-2 rounded"
                />
                <button
                    onClick={fetchReservations}
                    className="text-sm text-emerald-500 hover:text-emerald-400"
                >
                    Refrescar
                </button>
            </div>

            {loading ? (
                <p className="text-neutral-500">Cargando...</p>
            ) : (
                <div className="space-y-4">
                    {reservations.length === 0 && <p className="text-neutral-500">No hay reservas para este día.</p>}
                    {reservations.map(res => (
                        <div key={res.id} className="border border-neutral-800 p-4 rounded bg-neutral-950 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 text-xs rounded font-bold ${res.status === 'CONFIRMED' ? 'bg-emerald-900 text-emerald-400' :
                                            res.status === 'HOLD' ? 'bg-orange-900 text-orange-400' :
                                                res.status === 'CANCELLED' ? 'bg-red-900 text-red-400' :
                                                    'bg-neutral-800 text-neutral-400'
                                        }`}>
                                        {res.status}
                                    </span>
                                    <span className="text-sm text-neutral-300">
                                        {new Date(res.start_time).toLocaleTimeString()} - {new Date(res.end_time).toLocaleTimeString()}
                                    </span>
                                </div>
                                <p className="text-sm text-neutral-400 mt-1">{res.profiles?.email || 'Admin/Unknown'}</p>
                            </div>

                            <div className="flex gap-2">
                                {res.status !== 'CANCELLED' && res.status !== 'EXPIRED' && (
                                    <button
                                        onClick={() => handleCancel(res.id)}
                                        className="text-red-500 hover:text-red-400 text-sm border border-red-900/50 px-3 py-1 rounded hover:bg-red-900/20"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
