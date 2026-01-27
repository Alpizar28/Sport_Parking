'use client';

import { useState } from 'react';
import { approveReservation, rejectReservation } from '@/app/admin/actions';
import { Check, X, AlertCircle } from 'lucide-react';
import { formatTime, formatShortDate } from '@/lib/formatters';

interface Reservation {
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    total_amount: number;
    profiles?: { email: string; full_name?: string } | null;
    reservation_resources?: { resources: { name: string } | null }[];
}

export default function PendingReservationsTable({ data }: { data: any[] }) {
    const [loadingMap, setLoadingMap] = useState<Record<string, string | null>>({});

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        if (!confirm(`¿Estás seguro de ${action === 'approve' ? 'APROBAR' : 'RECHAZAR'} esta reserva?`)) return;

        setLoadingMap(prev => ({ ...prev, [id]: action }));
        try {
            if (action === 'approve') {
                await approveReservation(id);
            } else {
                await rejectReservation(id);
            }
        } catch (e) {
            alert('Error al procesar: ' + e);
        } finally {
            setLoadingMap(prev => ({ ...prev, [id]: null }));
        }
    };

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-20 bg-[#0f172a] border border-white/5 rounded-2xl">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Todo al día</h3>
                <p className="text-muted-foreground mt-2">No hay reservas pendientes de revisión.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full text-left text-sm text-gray-400 min-w-[600px]">
                <thead className="bg-white/5 text-gray-200 font-bold uppercase tracking-wider text-xs">
                    <tr>
                        <th className="px-6 py-4">Fecha / Hora</th>
                        <th className="px-6 py-4">Recurso</th>
                        <th className="px-6 py-4">Usuario</th>
                        <th className="px-6 py-4 text-right">Monto</th>
                        <th className="px-6 py-4 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-[#0f172a]">
                    {data.map((res: Reservation) => (
                        <tr key={res.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-bold text-white">
                                    {formatShortDate(res.start_time)}
                                </div>
                                <div className="text-xs">
                                    {formatTime(res.start_time)} - {formatTime(res.end_time)}
                                </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-white">
                                {res.reservation_resources?.[0]?.resources?.name || '---'}
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-white font-bold">{res.profiles?.full_name || 'Sin Nombre'}</div>
                                <div className="text-xs text-muted-foreground">{res.profiles?.email || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-white">
                                ${res.total_amount}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => handleAction(res.id, 'approve')}
                                        disabled={!!loadingMap[res.id]}
                                        className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg border border-emerald-500/20 transition-all disabled:opacity-50"
                                        title="Aprobar"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleAction(res.id, 'reject')}
                                        disabled={!!loadingMap[res.id]}
                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg border border-red-500/20 transition-all disabled:opacity-50"
                                        title="Rechazar"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
