import { createClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Role verification (Page Level)
    // We use a safe check here.
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-500/30">
                    <span className="font-bold text-red-500 text-2xl">!</span>
                </div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Acceso Denegado</h1>
                <p className="text-muted-foreground max-w-md mb-8">
                    Esta área es exclusiva para administradores. Si crees que esto es un error, contacta a soporte.
                </p>
                <a
                    href="/dashboard"
                    className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest rounded-full hover:bg-gray-200 transition-colors"
                >
                    Volver al Dashboard
                </a>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-foreground font-sans selection:bg-emerald-500/30">
            <AdminSidebar userEmail={user.email!} />
            <div className="lg:pl-64 pt-16 lg:pt-0 transition-all duration-300">
                <main className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
}
