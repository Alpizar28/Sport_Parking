'use client';

import { useState } from 'react';
import { ArrowRight, Tv, CalendarOff } from "lucide-react";
import Link from "next/link";
import { Match } from "@/lib/football";

export default function MatchWidgetClient({ initialMatches }: { initialMatches: Match[] }) {
    const [selectedTeam, setSelectedTeam] = useState<'PANAMA' | 'REAL_MADRID' | 'BARCELONA'>('PANAMA');

    // IDs from TSDB
    const TEAM_IDS = {
        PANAMA: '136141',
        REAL_MADRID: '133738',
        BARCELONA: '133739'
    };

    // Filter matches based on selected team
    // Match must have the selected team as home OR away
    const filteredMatches = initialMatches.filter(m =>
        // @ts-ignore: Properties exist in runtime football.ts
        m.homeId === TEAM_IDS[selectedTeam] || m.awayId === TEAM_IDS[selectedTeam]
    );

    return (
        <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 md:p-8 overflow-hidden group hover:border-white/20 transition-colors">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-white/5 gap-4">
                <span className="text-sm font-bold uppercase text-white tracking-widest flex items-center gap-2">
                    <Tv className="w-4 h-4 text-primary" />
                    En Pantallas
                </span>

                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedTeam('PANAMA')}
                        className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all ${selectedTeam === 'PANAMA' ? 'bg-primary text-black border-primary' : 'bg-transparent text-muted-foreground border-white/10 hover:text-white'}`}
                    >
                        Panamá
                    </button>
                    <button
                        onClick={() => setSelectedTeam('REAL_MADRID')}
                        className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all ${selectedTeam === 'REAL_MADRID' ? 'bg-primary text-black border-primary' : 'bg-transparent text-muted-foreground border-white/10 hover:text-white'}`}
                    >
                        Real Madrid
                    </button>
                    <button
                        onClick={() => setSelectedTeam('BARCELONA')}
                        className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all ${selectedTeam === 'BARCELONA' ? 'bg-primary text-black border-primary' : 'bg-transparent text-muted-foreground border-white/10 hover:text-white'}`}
                    >
                        Barcelona
                    </button>
                </div>
            </div>

            {/* Match List */}
            <div className="min-h-[250px] relative">
                {filteredMatches.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CalendarOff className="w-6 h-6 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-1">Partidos por Confirmar</h3>
                            <p className="text-xs text-muted-foreground">No hay partidos programados próximamente.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {filteredMatches.map((match, idx) => {
                            const matchDate = new Date(match.startTime);
                            const isToday = new Date().toDateString() === matchDate.toDateString();
                            const timeString = matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                            return (
                                <div key={match.id} className="flex items-center gap-4 group/match cursor-pointer">
                                    <div className="text-center w-16 flex-shrink-0">
                                        <span className={`block text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {isToday ? 'HOY' : matchDate.toLocaleDateString('es-ES', { weekday: 'short' })}
                                        </span>
                                        <span className="block text-lg font-black text-white tracking-tight">{timeString}</span>
                                    </div>

                                    <div className="flex-1 p-3 bg-white/5 rounded-lg border border-white/5 group-hover/match:border-primary/30 group-hover/match:bg-white/10 transition-all flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {/* @ts-ignore */}
                                                <span className={`font-bold text-sm ${match.homeId === TEAM_IDS[selectedTeam] ? 'text-white' : 'text-gray-400'}`}>{match.homeTeam}</span>
                                                <span className="text-[10px] text-muted-foreground font-bold">VS</span>
                                                {/* @ts-ignore */}
                                                <span className={`font-bold text-sm ${match.awayId === TEAM_IDS[selectedTeam] ? 'text-white' : 'text-gray-400'}`}>{match.awayTeam}</span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider truncate max-w-[120px]">{match.competition}</span>
                                                {match.specialPromo && (
                                                    <span className="text-[9px] text-amber-500 font-black uppercase tracking-widest px-1.5 py-0.5 bg-amber-500/10 rounded">{match.specialPromo}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer / Link */}
            <div className="mt-6 pt-6 border-t border-white/5 text-center">
                <Link href="/agenda" className="text-xs font-bold text-muted-foreground hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-2 group/link">
                    Ver Agenda Completa
                    <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
