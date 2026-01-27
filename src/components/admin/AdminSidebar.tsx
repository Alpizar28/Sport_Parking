'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Clock, LogOut, ChevronUp, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { signout } from '@/app/auth/actions';

const MENU_ITEMS = [
    { label: 'Resumen', href: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Reservas', href: '/admin/reservations', icon: CalendarDays },
    { label: 'Pendientes', href: '/admin/pending', icon: Clock },
];

export default function AdminSidebar({ userEmail }: { userEmail: string }) {
    const pathname = usePathname();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <aside className="w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col min-h-screen fixed left-0 top-0 bottom-0 z-40">
            {/* Logo Area */}
            <div className="h-20 flex items-center px-8 border-b border-white/5">
                <span className="text-xl font-bold tracking-tighter uppercase text-white">
                    Sport<span className="text-emerald-500">Admin</span>
                </span>
            </div>

            {/* Menu */}
            <nav className="flex-1 px-4 py-8 space-y-2">
                {MENU_ITEMS.map((item) => {
                    const isActive = item.exact
                        ? pathname === item.href
                        : pathname.startsWith(item.href);

                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all group ${isActive
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]'
                                    : 'text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-500' : 'text-gray-500 group-hover:text-white'}`} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / User */}
            <div className="p-4 border-t border-white/5 relative" ref={menuRef}>
                {/* User Menu Popup */}
                {showUserMenu && (
                    <div className="absolute bottom-full left-4 right-4 mb-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-2 fade-in duration-200 z-50">
                        <div className="mb-4">
                            <span className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Sesión Actual</span>
                            <span className="block text-sm font-bold text-white break-all">{userEmail}</span>
                        </div>
                        <form action={signout}>
                            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-500 text-xs font-bold uppercase tracking-widest transition-all">
                                <LogOut className="w-3 h-3" />
                                Cerrar Sesión
                            </button>
                        </form>
                    </div>
                )}

                {/* User Trigger */}
                <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all group text-left"
                >
                    <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center text-emerald-500 font-bold text-xs ring-2 ring-emerald-500/20 group-hover:ring-emerald-500/50 transition-all">
                        {userEmail.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="block text-xs font-bold text-white uppercase truncate">Admin</span>
                        <span className="block text-[10px] text-muted-foreground truncate group-hover:text-emerald-500/70 transition-colors">
                            {userEmail}
                        </span>
                    </div>
                    <ChevronUp className={`w-4 h-4 text-muted-foreground transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
            </div>
        </aside>
    );
}
