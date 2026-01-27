import { CalendarDays } from 'lucide-react';
import { formatTime, formatDate } from '@/lib/formatters';

interface Reservation {
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    total_amount: number;
    profiles?: { email: string } | null;
    reservation_resources?: { resources: { name: string } | null }[];
    created_at: string;
}

export default function ReservationsListTable({ data }: { data: any[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-20 bg-[#0f172a] border border-white/5 rounded-2xl">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarDays className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Sin Resultados</h3>
                <p className="text-muted-foreground mt-2">No se encontraron reservas con los filtros actuales.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-white/5 text-gray-200 font-bold uppercase tracking-wider text-xs">
                    <tr>
                        <th className="px-6 py-4">Fecha / Hora</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Recurso</th>
                        <th className="px-6 py-4">Usuario</th>
                        <th className="px-6 py-4 text-right">Monto</th>
                        <th className="px-6 py-4 text-right text-[10px] text-gray-600">Creada</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-[#0f172a]">
                    {data.map((res: Reservation) => {
                        const statusColor = res.status === 'CONFIRMED' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                            : res.status === 'HOLD' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                                : res.status === 'CANCELLED' ? 'text-red-500 bg-red-500/10 border-red-500/20'
                                    : 'text-gray-500 bg-gray-500/10';

                        return (
                            <tr key={res.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-white">
                                        {formatDate(res.start_time)}
                                    </div>
                                    <div className="text-xs">
                                        {formatTime(res.start_time)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${statusColor}`}>
                                        {res.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-white">
                                    {res.reservation_resources?.[0]?.resources?.name || '---'}
                                </td>
                                <td className="px-6 py-4 text-xs">
                                    {res.profiles?.email || 'N/A'}
                                    <div className="text-[10px] text-gray-600 font-mono mt-0.5">{res.id.slice(0, 8)}...</div>
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-white">
                                    ${res.total_amount}
                                </td>
                                <td className="px-6 py-4 text-right text-[10px]">
                                    {formatDate(res.created_at)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
