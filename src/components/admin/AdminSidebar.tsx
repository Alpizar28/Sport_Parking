'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Clock, LogOut, ChevronUp, User, Globe, Menu, X, Calendar } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { signout } from '@/app/auth/actions';

const MENU_ITEMS = [
    { label: 'Resumen', href: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Calendario', href: '/admin/calendar', icon: Calendar },
    { label: 'Reservas', href: '/admin/reservations', icon: CalendarDays },
    { label: 'Pendientes', href: '/admin/pending', icon: Clock },
];

export default function AdminSidebar({ userEmail }: { userEmail: string }) {
    const pathname = usePathname();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

    // Close mobile menu on path change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    return (
        <>
            {/* Mobile Header Toggle */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between px-4 z-50">
                <span className="text-lg font-bold tracking-tighter uppercase text-white">
                    Sport<span className="text-emerald-500">Admin</span>
                </span>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Backdrop for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
                w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col fixed top-0 bottom-0 z-50 transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                lg:translate-x-0 lg:left-0
            `}>
                {/* Logo Area (Hidden on mobile since we have the header) */}
                <div className="h-20 hidden lg:flex items-center px-8 border-b border-white/5">
                    <span className="text-xl font-bold tracking-tighter uppercase text-white">
                        Sport<span className="text-emerald-500">Admin</span>
                    </span>
                </div>

                {/* Mobile Extra Header Space */}
                <div className="h-16 lg:hidden flex items-center px-6 border-b border-white/5">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Menú</span>
                </div>

                {/* Menu */}
                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
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

                    <div className="pt-4 mt-4 border-t border-white/5">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent transition-all group"
                        >
                            <Globe className="w-5 h-5 text-blue-500 group-hover:text-blue-400" />
                            <span className="group-hover:text-blue-400 transition-colors">Volver al Sitio</span>
                        </Link>
                    </div>
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
        </>
    );
}
