'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search, Filter } from 'lucide-react';

export default function ReservationFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [status, setStatus] = useState(searchParams.get('status') || 'ALL');
    const [query, setQuery] = useState(searchParams.get('query') || '');

    const handleFilterChange = (newStatus: string) => {
        setStatus(newStatus);
        const params = new URLSearchParams(window.location.search);
        if (newStatus === 'ALL') params.delete('status');
        else params.set('status', newStatus);
        params.set('page', '1'); // Reset to page 1

        startTransition(() => router.push(`/admin/reservations?${params.toString()}`));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(window.location.search);
        if (query) params.set('query', query);
        else params.delete('query');
        params.set('page', '1');

        startTransition(() => router.push(`/admin/reservations?${params.toString()}`));
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-white/5 border border-white/5 rounded-2xl">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    placeholder="Buscar ID de reserva..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50"
                />
            </form>

            {/* Filter Status */}
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                    value={status}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="bg-[#0a0a0a] border border-white/10 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                >
                    <option value="ALL">Todos los Estados</option>
                    <option value="CONFIRMED">Confirmadas</option>
                    <option value="HOLD">Pendientes (Hold)</option>
                    <option value="CANCELLED">Canceladas</option>
                </select>
            </div>
        </div>
    );
}
