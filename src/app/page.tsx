import Link from "next/link";
import { ArrowRight, Ticket, Users, Trophy, Tv, Beer, Car, User } from "lucide-react";
import { createClient } from "@/lib/supabase";
import LiveSportsExperience from "@/components/home/LiveSportsExperience";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user reservations if logged in
  let userReservations = null;
  if (user) {
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })
      .limit(2);
    userReservations = data;
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
                <Link href="/dashboard" className="hidden sm:flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-wider group">
                  <Ticket className="w-4 h-4 text-emerald-500 group-hover:text-emerald-400" />
                  <span>Mis Reservas</span>
                </Link>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Conectado como</span>
                    <span className="block text-sm font-bold text-white max-w-[150px] truncate">{user.email}</span>
                  </div>
                  <div className="h-10 w-10 bg-gradient-to-br from-primary to-emerald-700 rounded-full flex items-center justify-center text-black font-bold border border-white/10 shadow-lg">
                    <User className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-wider"
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
            <div className="hidden lg:flex flex-col gap-6 relative">

              {/* HISTORIAL / MIS RESERVAS SI EXISTEN */}
              {userReservations && userReservations.length > 0 && (
                <div className="relative bg-[#0a0a0a] border border-emerald-500/30 rounded-2xl p-6 overflow-hidden shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)]">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                    <span className="text-sm font-bold uppercase text-white tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      Tus Reservas
                    </span>
                  </div>
                  <div className="space-y-4">
                    {userReservations.map((res: any) => (
                      <div key={res.id} className="flex items-center gap-4 group">
                        <div className="text-center w-14 bg-white/5 rounded-lg p-2 border border-white/5 group-hover:border-primary/50 transition-colors">
                          <span className="block text-[10px] text-muted-foreground font-bold uppercase">{new Date(res.start_time).toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                          <span className="block text-xl font-black text-white leading-none">{new Date(res.start_time).getDate()}</span>
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm uppercase tracking-wide">{res.type === 'FIELD' ? 'Cancha Sintética' : 'Evento Lounge'}</div>
                          <div className="text-xs text-muted-foreground font-medium flex gap-2 items-center">
                            <span>{new Date(res.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <span className={`${res.status === 'HOLD' ? 'text-amber-500' : 'text-emerald-500'} font-bold`}>
                              {res.status === 'HOLD' ? 'En Revisión' : res.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur-lg opacity-30" />
                <LiveSportsExperience />
              </div>
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
              <div className="group relative h-[400px] rounded-2xl overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-emerald-900/20 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8">
                  <Users className="w-10 h-10 text-emerald-500 mb-4" />
                  <h3 className="text-3xl font-bold text-white uppercase italic tracking-tighter mb-2">Juega</h3>
                  <p className="text-gray-400 text-sm mb-6 line-clamp-2">2 Canchas Sintéticas Pro. Fútbol 5 y 7. Iluminación nocturna y vestuarios.</p>
                  <span className="inline-flex items-center gap-2 text-emerald-400 font-bold uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">
                    Reservar Cancha <ArrowRight className="w-4 h-4" />
                  </span>
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
                  <span className="inline-flex items-center gap-2 text-amber-400 font-bold uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">
                    Reservar Mesa <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Space Card 3: PARK */}
              <div className="group relative h-[400px] rounded-2xl overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8">
                  <Car className="w-10 h-10 text-blue-500 mb-4" />
                  <h3 className="text-3xl font-bold text-white uppercase italic tracking-tighter mb-2">Estaciona</h3>
                  <p className="text-gray-400 text-sm mb-6 line-clamp-2">Parqueo privado y seguro dentro del complejo. Tu auto cuidado mientras disfrutas.</p>
                  <span className="inline-flex items-center gap-2 text-blue-400 font-bold uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">
                    Asegurar Puesto <ArrowRight className="w-4 h-4" />
                  </span>
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
