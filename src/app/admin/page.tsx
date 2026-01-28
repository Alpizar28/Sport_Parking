import { getAdminStats } from './actions';
import { Users, Clock, CheckCircle, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatTime } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export default async function AdminSummaryPage() {
    const stats = await getAdminStats();

    // Fallback if stats fail
    if (!stats) {
        return (
            <div className="p-8 text-center border dashed border-white/10 rounded-xl">
                Error cargando estadísticas.
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                    Resumen <span className="text-emerald-500">Operativo</span>
                </h1>
                <p className="text-muted-foreground mt-1 text-sm font-medium">
                    Vista general de la actividad de hoy
                </p>
                {stats.systemStatus === 'FALLBACK_AUTH' && (
                    <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs rounded font-mono">
                        ⚠️ Modo Fallback: Llave de Servicio no detectada o inválida. Algunos datos pueden faltar.
                    </div>
                )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Today's Reservations */}
                <div className="bg-[#0f172a] border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Calendar className="w-16 h-16 text-white" />
                    </div>
                    <div className="relative z-10">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Reservas Hoy</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white">{stats.todayCount}</span>
                            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">ACTIVAS</span>
                        </div>
                    </div>
                </div>

                {/* Card 2: Pending */}
                <Link href="/admin/pending" className="bg-[#0f172a] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock className="w-16 h-16 text-amber-500" />
                    </div>
                    <div className="relative z-10">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Pendientes de Aprobación</span>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-4xl font-black ${stats.pendingCount > 0 ? 'text-amber-500' : 'text-white'}`}>{stats.pendingCount}</span>
                            {stats.pendingCount > 0 && (
                                <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse">ACCIÓN REQUERIDA</span>
                            )}
                        </div>
                    </div>
                </Link>

                {/* Card 3: Week Performance */}
                <div className="bg-[#0f172a] border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CheckCircle className="w-16 h-16 text-emerald-500" />
                    </div>
                    <div className="relative z-10">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Confirmadas (7 Días)</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white">{stats.confirmedWeek}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upcoming List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#0f172a] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wide">Próximas Reservas (Hoy)</h3>
                        <Link href="/admin/reservations" className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest hover:text-emerald-400">Ver Todo</Link>
                    </div>

                    <div className="divide-y divide-white/5">
                        {stats.upcomingToday.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                No hay más reservas para hoy.
                            </div>
                        ) : (
                            stats.upcomingToday.map((res: any) => (
                                <div key={res.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-black border border-white/5 flex flex-col items-center justify-center text-center">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase">{formatTime(res.start_time)}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white uppercase">
                                                {res.reservation_resources?.[0]?.resources?.name || 'Cancha'}
                                            </p>
                                            <div className="text-xs">
                                                <span className="block text-white font-medium">{res.profiles?.full_name || 'Sin nombre'}</span>
                                                <span className="block text-muted-foreground text-[10px]">{res.profiles?.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider ${res.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-500' :
                                        res.status === 'HOLD' ? 'bg-amber-500/10 text-amber-500' : 'bg-gray-500/10 text-gray-500'
                                        }`}>
                                        {res.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="bg-gradient-to-br from-[#0f172a] to-black border border-white/5 rounded-2xl p-6">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wide mb-6">Acciones Rápidas</h3>
                    <div className="space-y-4">
                        <Link href="/admin/pending" className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group">
                            <span className="font-bold text-white text-sm">Revisar Pendientes</span>
                            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ArrowRight className="w-4 h-4 text-white" />
                            </div>
                        </Link>
                        <Link href="/admin/reservations" className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group">
                            <span className="font-bold text-white text-sm">Ver Historial Completo</span>
                            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ArrowRight className="w-4 h-4 text-white" />
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
