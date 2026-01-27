import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface DateNavProps {
    date: Date;
    onDateChange: (date: Date) => void;
    onRefresh: () => void;
    loading?: boolean;
}

export default function DateNav({ date, onDateChange, onRefresh, loading }: DateNavProps) {
    const handlePrev = () => onDateChange(subDays(date, 1));
    const handleNext = () => onDateChange(addDays(date, 1));
    const handleToday = () => onDateChange(new Date());

    return (
        <div className="flex items-center gap-2 bg-neutral-900/50 p-2 rounded-lg border border-neutral-800 backdrop-blur-sm">
            <button
                onClick={handlePrev}
                disabled={loading}
                className="p-2 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div className="flex flex-col items-center px-2">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {format(date, 'EEEE', { locale: es })}
                </span>
                <span className="text-sm md:text-lg font-bold text-white min-w-[100px] text-center">
                    {format(date, 'd MMM yyyy', { locale: es })}
                </span>
            </div>

            <button
                onClick={handleNext}
                disabled={loading}
                className="p-2 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>

            <div className="w-px h-8 bg-neutral-800 mx-1" />

            <button
                onClick={handleToday}
                disabled={loading}
                className="hidden md:block px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition-colors"
                title="Ir a Hoy"
            >
                Hoy
            </button>

            <button
                onClick={onRefresh}
                disabled={loading}
                className={`p-2 rounded text-neutral-400 hover:text-white transition-all disabled:opacity-50 ${loading ? 'animate-spin text-emerald-500' : 'hover:bg-neutral-800'}`}
                title="Refrescar datos"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
        </div>
    );
}
