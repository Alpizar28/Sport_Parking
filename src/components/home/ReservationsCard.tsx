'use client';

import { Ticket, Calendar, ArrowRight, User, LogIn, Clock } from "lucide-react";
import Link from "next/link";
import { formatTime, formatDate, formatShortDate } from "@/lib/formatters";

interface Reservation {
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    total_amount: number;
    type: string;
    reservation_resources?: {
        resources?: {
            name: string;
        }
    }[];
}

interface ReservationsCardProps {
    user: any;
    reservations: Reservation[] | null;
}

export default function ReservationsCard({ user, reservations }: ReservationsCardProps) {
    // FORMATTERS


    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'HOLD': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'CANCELLED': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'Confirmada';
            case 'HOLD': return 'Pendiente';
            case 'CANCELLED': return 'Cancelada';
            default: return status;
        }
    };

    // 1. NO SESSION STATE
    if (!user) {
        return (
            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 overflow-hidden group h-full min-h-[300px] flex flex-col justify-center text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/5 to-transparent opacity-50" />

                <div className="relative z-10 space-y-6">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5 group-hover:border-primary/30 transition-colors">
                        <Ticket className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Mis Reservas</h3>
                        <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                            Inicia sesión para ver tu historial de reservas y gestionar tus juegos.
                        </p>
                    </div>

                    <div className="pt-2">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-white transition-all hover:scale-105"
                        >
                            <User className="w-4 h-4" />
                            <span>Iniciar Sesión</span>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // 2. LOGGED IN BUT NO RESERVATIONS
    if (!reservations || reservations.length === 0) {
        return (
            <div className="relative bg-[#0a0a0a] border border-emerald-500/30 rounded-2xl p-6 overflow-hidden h-full min-h-[300px] flex flex-col">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                    <span className="text-sm font-bold uppercase text-white tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        Tus Reservas
                    </span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Historial Reciente</span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                        <Calendar className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-white font-bold uppercase tracking-wide text-sm">Sin reservas recientes</p>
                        <p className="text-xs text-muted-foreground mt-1 px-4">¡La cancha te espera! Haz tu primera reserva hoy mismo.</p>
                    </div>
                    <Link
                        href="/reservations/new"
                        className="mt-2 inline-flex items-center gap-2 px-5 py-2 bg-primary text-black rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-400 transition-colors"
                    >
                        Reservar Cancha
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        );
    }

    // 3. LOGGED IN WITH RESERVATIONS
    return (
        <div className="relative bg-[#0a0a0a] border border-emerald-500/30 rounded-2xl p-6 overflow-hidden flex flex-col max-h-[500px]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5 flex-shrink-0">
                <span className="text-sm font-bold uppercase text-white tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Tus Reservas
                </span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Historial Reciente</span>
            </div>

            <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar flex-1">
                {reservations.map((res) => (
                    <div key={res.id} className="flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all group">
                        {/* Date Box */}
                        <div className="flex-shrink-0 text-center w-12 bg-black/40 rounded-lg p-2 border border-white/5 group-hover:border-primary/30 transition-colors">
                            <span className="block text-[9px] text-muted-foreground font-bold uppercase">{new Date(res.start_time).toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 3)}</span>
                            <span className="block text-[9px] text-muted-foreground font-bold uppercase">{new Date(res.start_time).toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 3)}</span>
                            <span className="block text-lg font-black text-white leading-none">{new Date(res.start_time).getDate()}</span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-white text-xs uppercase tracking-wide truncate pr-2">
                                    {res.reservation_resources?.[0]?.resources?.name || (res.type === 'EVENT' ? 'Evento' : 'Cancha Sintética')}
                                </span>
                                <span className={`flex-shrink-0 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${getStatusStyle(res.status)}`}>
                                    {getStatusLabel(res.status)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-primary/70" />
                                    <span>{formatTime(res.start_time)} - {formatTime(res.end_time)}</span>
                                </div>
                                {res.total_amount > 0 && (
                                    <div className="font-mono text-emerald-500/80">
                                        ${res.total_amount}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
