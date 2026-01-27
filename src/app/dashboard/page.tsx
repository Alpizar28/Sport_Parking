import { createClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { signout } from '../auth/actions';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';
import { Plus, Calendar, LogOut, Ticket, Clock, CheckCircle, XCircle, ArrowRight, Trophy } from 'lucide-react';
import UserNav from '@/components/layout/UserNav';
import { formatTime, formatShortDate } from '@/lib/formatters';

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check for Admin Role
    let isAdmin = false;
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        if (profile?.role === 'ADMIN') isAdmin = true;
    }

    if (!user) {
        redirect('/login');
    }

    // Fetch user reservations (All history)
    const { data: myReservations } = await supabase
        .from('reservations')
        .select(`
            id, start_time, end_time, status, total_amount,
            reservation_resources(
                resources(name)
            )
        `)
        .eq('user_id', user.id)
        .order('start_time', { ascending: false }) // Newest first
        .limit(20);

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-primary/30">
            {/* Navbar Transparente Integrado (Diseño Home) */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md left-0">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-black transition-all">
                            <Trophy className="w-5 h-5 text-primary group-hover:text-black transition-colors" />
                        </div>
                        <span className="text-xl font-bold tracking-tighter uppercase text-white">
                            Sport<span className="text-primary">Parking</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-6 pl-4 border-l border-white/10">
                            <UserNav userEmail={user.email!} isAdmin={isAdmin} />
                        </div>
                    </div>
                </div>
            </nav>

            <div className="pt-24 max-w-6xl mx-auto p-4 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <p className="text-muted-foreground font-medium mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            Bienvenido, {user.email?.split('@')[0]}
                        </p>
                    </div>
                    <div>
                        <Link href="/" className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg font-bold text-sm uppercase tracking-wider transition-colors flex items-center gap-2 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]">
                            <ArrowRight className="w-4 h-4 rotate-180" />
                            <span>Volver al Inicio</span>
                        </Link>
                    </div>
                </div>

                <main className="grid gap-8 md:grid-cols-12">
                    {/* Left Column: Actions & Highlights */}
                    <div className="md:col-span-4 space-y-6">
                        {/* New Reservation Card */}
                        <section className="bg-gradient-to-br from-primary/20 to-emerald-900/20 border border-primary/20 rounded-2xl p-6 relative overflow-hidden group">

                            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2 relative z-10">Nueva Reserva</h2>
                            <p className="text-emerald-100/70 text-sm mb-6 relative z-10">¿Listo para jugar? Agenda tu cancha o evento en segundos.</p>

                            <div className="space-y-3 relative z-10">
                                <Link
                                    href="/reservations/new?type=FIELD"
                                    className="flex items-center justify-between w-full bg-primary hover:bg-emerald-400 text-black px-4 py-3 rounded-lg font-bold uppercase tracking-wider text-xs shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] transition-all transform active:scale-95"
                                >
                                    <span>Reservar Cancha</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    href="/reservations/new?type=EVENT"
                                    className="flex items-center justify-between w-full bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/30 text-white px-4 py-3 rounded-lg font-bold uppercase tracking-wider text-xs transition-all"
                                >
                                    <span>Evento / Cumpleaños</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    href="/"
                                    className="block text-center w-full text-[10px] font-bold text-emerald-500/80 hover:text-emerald-400 uppercase tracking-widest py-2 transition-colors"
                                >
                                    Volver al Inicio
                                </Link>
                            </div>
                        </section>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 text-center">
                                <span className="block text-3xl font-black text-white mb-1">{myReservations?.length || 0}</span>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Total Reservas</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Full History List */}
                    <div className="md:col-span-8">
                        <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-primary" />
                                    Historial de Reservas
                                </h3>
                            </div>

                            <div className="divide-y divide-white/5">
                                {(!myReservations || myReservations.length === 0) ? (
                                    <div className="p-12 text-center">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Calendar className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground font-medium">Aún no tienes reservas.</p>
                                        <p className="text-sm text-muted-foreground/50 mt-1">¡Anímate a jugar!</p>
                                    </div>
                                ) : (
                                    myReservations.map(res => {
                                        const isPast = new Date(res.end_time) < new Date();
                                        const statusLabel = res.status === 'HOLD' || res.status === 'PAYMENT_PENDING' ? 'En Revisión' :
                                            res.status === 'CONFIRMED' ? 'Confirmado' :
                                                res.status === 'CANCELLED' ? 'Cancelado' : res.status;

                                        const statusColor = res.status === 'HOLD' || res.status === 'PAYMENT_PENDING' ? 'text-amber-500' :
                                            res.status === 'CONFIRMED' ? 'text-primary' :
                                                res.status === 'CANCELLED' ? 'text-red-500' : 'text-gray-500';

                                        const statusBg = res.status === 'HOLD' || res.status === 'PAYMENT_PENDING' ? 'bg-amber-500/10 border-amber-500/20' :
                                            res.status === 'CONFIRMED' ? 'bg-primary/10 border-primary/20' :
                                                res.status === 'CANCELLED' ? 'bg-red-500/10 border-red-500/20' : 'bg-gray-500/10';

                                        return (
                                            <div key={res.id} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center hover:bg-white/[0.02] transition-colors">
                                                {/* Date Badge */}
                                                <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center border ${isPast ? 'bg-white/5 border-white/5 text-muted-foreground' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                                                    <span className="text-xs font-bold uppercase tracking-wider">{new Date(res.start_time).toLocaleDateString('es-ES', { month: 'short' })}</span>
                                                    <span className="text-2xl font-black leading-none">{new Date(res.start_time).getDate()}</span>
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        {/* @ts-ignore */}
                                                        <h4 className="font-bold text-white text-lg">{res.reservation_resources?.[0]?.resources?.name || 'Reserva General'}</h4>
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusBg} ${statusColor}`}>
                                                            {statusLabel}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {formatTime(res.start_time)} - {formatTime(res.end_time)}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Ticket className="w-4 h-4" />
                                                            ${res.total_amount}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action (Placeholder for now) */}
                                                <div>
                                                    {res.status === 'HOLD' && (
                                                        <div className="text-[10px] uppercase font-bold text-amber-500 animate-pulse">
                                                            Validando Pago...
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
