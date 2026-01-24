import { createClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import AdminReservationList from '@/components/admin/AdminReservationList';
import AdminBlockForm from '@/components/admin/AdminBlockForm';

export default async function AdminDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // Verify Admin Role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'ADMIN') {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                <h1 className="text-xl">Acceso Denegado. Se requiere rol ADMIN.</h1>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8">
            <header className="mb-8 flex justify-between items-center border-b border-neutral-800 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-emerald-500">Panel Admin</h1>
                    <p className="text-neutral-400">Gestionar Reservas</p>
                </div>
                <div className="flex gap-4">
                    {/* Minimal nav for MVP */}
                    <a href="/dashboard" className="text-neutral-400 hover:text-white">Ir al Sitio</a>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List of Reservations Component (client side fetcher) */}
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-4">Reservas del Día</h2>
                    {/* We'll use a client component here to fetch and render list + actions */}
                    <AdminReservationList />
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
                        <h3 className="text-lg font-medium mb-4">Bloquear Horario</h3>
                        <AdminBlockForm />
                    </div>
                </div>
            </main>
        </div>
    );
}
