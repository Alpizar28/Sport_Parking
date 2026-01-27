'use client';

import { useState, useRef, useEffect } from "react";
import { User, LogOut, ChevronDown, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { signout } from "@/app/auth/actions";

interface UserNavProps {
    userEmail: string;
    isAdmin?: boolean;
}

export default function UserNav({ userEmail, isAdmin }: UserNavProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 group focus:outline-none"
            >
                <div className="text-right hidden sm:block">
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-widest group-hover:text-emerald-500 transition-colors">Conectado como</span>
                    <span className="block text-sm font-bold text-white max-w-[150px] truncate">{userEmail}</span>
                </div>
                <div className="h-10 w-10 bg-gradient-to-br from-primary to-emerald-700 rounded-full flex items-center justify-center text-black font-bold border border-white/10 shadow-lg group-hover:scale-105 transition-transform relative">
                    <User className="w-5 h-5" />
                    {/* Status Dot */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full"></span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-4 w-64 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-2 animate-in slide-in-from-top-2 fade-in duration-200 z-50 overflow-hidden">
                    {/* Mobile Info (visible in dropdown to reinforce) */}
                    <div className="px-4 py-3 border-b border-white/5 mb-2">
                        <span className="block text-xs font-bold text-white uppercase truncate">{userEmail}</span>
                        <span className="block text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5">
                            {isAdmin ? 'Administrador' : 'Miembro'}
                        </span>
                    </div>

                    <div className="space-y-1">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 rounded-lg text-sm font-bold text-gray-300 hover:text-white transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                            Mi Dashboard
                        </Link>

                        {isAdmin && (
                            <Link
                                href="/admin"
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 rounded-lg text-sm font-bold text-gray-300 hover:text-white transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <LayoutDashboard className="w-4 h-4 text-amber-500" />
                                Panel Admin
                            </Link>
                        )}

                        {/* Sign Out Action */}
                        <form action={signout}>
                            <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 rounded-lg text-sm font-bold text-gray-300 hover:text-red-500 transition-colors text-left">
                                <LogOut className="w-4 h-4" />
                                Cerrar Sesión
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
