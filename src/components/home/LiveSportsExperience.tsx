import { Tv } from "lucide-react";

export default function LiveSportsExperience() {
    return (
        <div className="relative bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Header */}
            <div className="flex justify-between items-center mb-10 pb-4 border-b border-white/5 relative z-10">
                <span className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-3">
                    <Tv className="w-4 h-4 text-emerald-500" />
                    En Pantallas
                </span>
                <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
            </div>

            {/* Conceptual Visual */}
            <div className="relative z-10 text-center py-2 space-y-4">
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                    Fútbol  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-primary">En Vivo</span>
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
                    Vive los mejores eventos deportivos en nuestras pantallas gigantes de alta definición.
                </p>
                <div className="w-16 h-1 bg-white/10 mx-auto rounded-full my-6" />
                <p className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-widest border border-emerald-500/10 inline-block px-3 py-1 rounded-full">
                    Programación sujeta a disponibilidad
                </p>
            </div>
        </div>
    );
}
