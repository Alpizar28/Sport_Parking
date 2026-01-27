import Link from "next/link";
import { ArrowRight, Ticket, Users, Trophy, Tv, Beer, Car, User } from "lucide-react";
import { createClient } from "@/lib/supabase";
import ReservationsCard from "@/components/home/ReservationsCard";
import UserNav from "@/components/layout/UserNav";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // Check for Admin Role & Profile
  let isAdmin = false;
  let userProfile = null;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name, avatar_url')
      .eq('id', user.id)
      .single();

    if (profile) {
      userProfile = profile;
      if (profile.role === 'ADMIN') isAdmin = true;
    }
  }
  // Fetch user reservations if logged in
  let userReservations = null;
  if (user) {
    console.log('[Home] Fetching reservations for user:', user.id);
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id, start_time, end_time, status, total_amount, type, hold_expires_at,
        reservation_resources!inner(
          resources(name)
        )
      `)
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[Home] Error fetching reservations (likely recursion/RLS):', error.message || error);
      // Fallback: Fetch without resources if the join failed
      console.log('[Home] Attempting fallback fetch...');
      const { data: fallbackData } = await supabase
        .from('reservations')
        .select('id, start_time, end_time, status, total_amount, type, hold_expires_at')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(20);

      if (fallbackData) {
        userReservations = fallbackData;
      }
    } else {
      // Filter out expired holds
      const now = new Date();
      userReservations = data?.filter(r => {
        if (r.status === 'HOLD' && r.hold_expires_at) {
          const expires = new Date(r.hold_expires_at);
          // If expired, don't show
          if (expires < now) return false;
        }
        return true;
      }) || [];
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      {/* Navbar Transparente Integrado */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
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
            {user ? (
              <div className="flex items-center gap-6 pl-4 border-l border-white/10">
                <UserNav
                  userEmail={user.email!}
                  userName={userProfile?.full_name}
                  avatarUrl={userProfile?.avatar_url}
                  isAdmin={isAdmin}
                />
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:block text-sm font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-wider"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 hover:text-primary text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        {/* HERO: The Venue Experience */}
        <section className="relative min-h-screen flex flex-col justify-center px-6 overflow-hidden bg-black">
          {/* Background Image Effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/40 via-black to-black opacity-80" />
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />

          <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-20">
            <div className="space-y-8">


              <h1 className="text-5xl md:text-7xl font-black text-white uppercase leading-[0.9] tracking-tighter">
                Fútbol.<br />
                Amigos.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-200">Vivencia.</span>
              </h1>

              <p className="text-lg text-muted-foreground font-light max-w-xl leading-relaxed border-l-2 border-primary/30 pl-6">
                El lugar donde el deporte se siente de verdad. Canchas sintéticas de primer nivel, ambiente inigualable y la experiencia completa del tercer tiempo.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/reservations/new" className="group flex items-center justify-center gap-3 px-8 py-5 bg-primary text-black font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)] hover:scale-105">
                  <Ticket className="w-5 h-5" />
                  <span>Reservar Cancha</span>
                </Link>
                <Link href="#espacios" className="group flex items-center justify-center gap-3 px-8 py-5 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                  <ArrowRight className="w-5 h-5" />
                  <span>Ver El Lugar</span>
                </Link>
              </div>
            </div>

            {/* Right Side Visual / Agenda Preview */}
            <div className="hidden lg:flex flex-col gap-6 relative h-[600px]">
              <ReservationsCard user={user} reservations={userReservations} />
            </div>
          </div>
        </section>

        {/* The Spaces / Services */}
        <section id="espacios" className="py-24 bg-neutral-950">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">El Spot Completo</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Diseñado para que vivas el deporte antes, durante y después del juego.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Space Card 1: PLAY */}
              <div className="group relative h-[400px] rounded-2xl overflow-hidden cursor-pointer border-t-4 border-emerald-500">
                <div className="absolute inset-0 bg-emerald-900/20 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8">
                  <Users className="w-10 h-10 text-emerald-500 mb-4" />
                  <h3 className="text-3xl font-bold text-white uppercase italic tracking-tighter mb-2">Juega</h3>
                  <p className="text-gray-400 text-sm mb-6 line-clamp-2">2 Canchas Sintéticas Pro. Fútbol 5 y 7. Iluminación nocturna y vestuarios.</p>
                </div>
              </div>

              {/* Space Card 2: WATCH */}
              <div className="group relative h-[400px] rounded-2xl overflow-hidden cursor-pointer border-t-4 border-amber-500">
                <div className="absolute inset-0 bg-amber-900/10 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8">
                  <Beer className="w-10 h-10 text-amber-500 mb-4" />
                  <h3 className="text-3xl font-bold text-white uppercase italic tracking-tighter mb-2">Vive</h3>
                  <p className="text-gray-400 text-sm mb-6 line-clamp-2">Zona Lounge con Pantallas 4K. Mesas para tu grupo, audio envolvente y barra.</p>
                </div>
              </div>

              {/* Space Card 3: PARK */}
              <div className="group relative h-[400px] rounded-2xl overflow-hidden cursor-pointer border-t-4 border-blue-500">
                <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8">
                  <Car className="w-10 h-10 text-blue-500 mb-4" />
                  <h3 className="text-3xl font-bold text-white uppercase italic tracking-tighter mb-2">Estaciona</h3>
                  <p className="text-gray-400 text-sm mb-6 line-clamp-2">Parqueo privado y seguro dentro del complejo. Tu auto cuidado mientras disfrutas.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Visuals */}
        <section className="py-24 bg-black relative border-t border-white/5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900/50 via-black to-black" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="mb-12">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Instalaciones de Primera</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl overflow-hidden border border-white/10 group shadow-2xl h-[400px]">
                <div className="relative h-full">
                  <img src="/cancha1.png" alt="Cancha Principal" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                  <div className="absolute bottom-6 left-6">
                    <h3 className="text-xl font-bold text-white uppercase italic tracking-wider mb-1">Cancha 1</h3>
                    <p className="text-gray-300 text-xs">Torneos y Retos</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden border border-white/10 group shadow-2xl h-[400px] mt-0 md:mt-8">
                <div className="relative h-full">
                  <img src="/partido1.png" alt="Ambiente de Partido" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                  <div className="absolute bottom-6 left-6">
                    <h3 className="text-xl font-bold text-white uppercase italic tracking-wider mb-1">Vive el Partido</h3>
                    <p className="text-gray-300 text-xs">La mejor experiencia en vivo</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden border border-white/10 group shadow-2xl h-[400px] mt-0 md:mt-16">
                <div className="relative h-full">
                  <img src="/cancha2.png" alt="Cancha Secundaria" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                  <div className="absolute bottom-6 left-6">
                    <h3 className="text-xl font-bold text-white uppercase italic tracking-wider mb-1">Cancha 2</h3>
                    <p className="text-gray-300 text-xs">Entrenamiento y Diversión</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 bg-black py-12 text-center md:text-left">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Sport Parking</h4>
              <p className="text-muted-foreground max-w-sm mb-4">
                El único lugar donde tu pasión por el fútbol tiene cancha, pantalla y estacionamiento asegurado.
              </p>
              <div className="flex gap-2 text-sm font-bold text-emerald-500 uppercase tracking-wider">
                <span>• Canchas Sintéticas</span>
                <span>• Academia de Fútbol</span>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-white uppercase tracking-widest mb-4">Ubicación y Contacto</h5>
              <p className="text-sm text-muted-foreground leading-relaxed">
                C. B Sur 410-3, David<br />
                Provincia de Chiriquí<br />
                <span className="text-white font-bold block mt-2">Tel: 6648-0020</span>
              </p>
            </div>

            <div>
              <h5 className="font-bold text-white uppercase tracking-widest mb-4">Horarios</h5>
              <p className="text-sm text-muted-foreground">
                Lunes a Domingo<br />
                <span className="text-white font-bold">8:00 AM - 12:00 AM</span>
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
