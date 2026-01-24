import { createClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { signout } from '../auth/actions';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';
import { Plus, Calendar, LogOut } from 'lucide-react';

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch user reservations
    const now = new Date().toISOString();
    const { data: myReservations } = await supabase
        .from('reservations')
        .select(`
            id, start_time, end_time, status, total_amount,
            reservation_resources(
                resources(name)
            )
        `)
        .eq('user_id', user.id)
        .in('status', ['HOLD', 'PAYMENT_PENDING', 'CONFIRMED'])
        // Filter expired holds
        // Logic: if HOLD/PAYMENT_PENDING and hold_expires_at < now -> don't show?
        .gte('end_time', now) // Only show future/ongoing
        .order('start_time', { ascending: true })
        .limit(5);

    return (
        <AppLayout>
            <div className="max-w-5xl mx-auto p-4 md:p-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">Sport Parking</h1>
                        <p className="text-white font-medium mt-1 drop-shadow-sm opacity-90">Hola, {user.email}</p>
                    </div>
                    <form action={signout}>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors text-sm font-semibold shadow-sm">
                            <LogOut className="w-4 h-4" />
                            Cerrar Sesión
                        </button>
                    </form>
                </header>

                <main className="grid gap-8 md:grid-cols-3">
                    {/* Main Action Card */}
                    <div className="md:col-span-2 space-y-6">
                        <section className="glass-card p-8 relative overflow-hidden group">
                            {/* Decorative Plus Icon REMOVED per request */}

                            <h2 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">Nueva Reserva</h2>
                            <p className="text-gray-600 mb-8 max-w-md relative z-10">Agenda tu próxima partida o evento. Selecciona una opción para ver disponibilidad.</p>

                            <div className="flex flex-wrap gap-4 relative z-10">
                                <Link
                                    href="/reservations/new?type=FIELD"
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all transform hover:-translate-y-1"
                                >
                                    Reservar Cancha
                                </Link>
                                <Link
                                    href="/reservations/new?type=EVENT"
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-1"
                                >
                                    Evento / Cumpleaños
                                </Link>
                            </div>
                        </section>

                        {/* Recent Activity / Status */}
                        <div className="glass-card p-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                Actividad Reciente
                            </h3>
                            {(!myReservations || myReservations.length === 0) ? (
                                <div className="text-center py-8 text-gray-500 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                                    No tienes reservas activas.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {myReservations.map(res => (
                                        <div key={res.id} className="p-4 rounded-lg bg-white border border-gray-100 flex justify-between items-center shadow-sm">
                                            <div>
                                                {/* @ts-ignore: Nested resources type */}
                                                <div className="font-bold text-gray-900">{res.reservation_resources?.[0]?.resources?.name || 'Reserva'}</div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(res.start_time).toLocaleDateString()} • {new Date(res.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${res.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                                                res.status === 'HOLD' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {res.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar / Profile / Active Status */}
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Mis Reservas</h2>
                            <div className="space-y-3">
                                {myReservations?.slice(0, 3).map(res => (
                                    <div key={res.id} className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex justify-between items-center">
                                        <div>
                                            {/* @ts-ignore */}
                                            <div className="text-sm font-bold text-emerald-900">{res.reservation_resources?.[0]?.resources?.name || 'Cancha'}</div>
                                            <div className="text-xs text-emerald-700">
                                                {new Date(res.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(res.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <span className={`text-xs font-bold bg-white px-2 py-1 rounded shadow-sm ${res.status === 'CONFIRMED' ? 'text-emerald-600' :
                                            'text-orange-500'
                                            }`}>{res.status}</span>
                                    </div>
                                ))}

                                {(!myReservations || myReservations.length === 0) && (
                                    <p className="text-sm text-gray-400 italic">Sin actividad.</p>
                                )}

                                <Link href="/reservations/me" className="block text-center text-sm font-semibold text-emerald-600 hover:text-emerald-500 mt-4">
                                    Ver historial completo
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}
