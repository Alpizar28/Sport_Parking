import { getAdminReservations } from '../actions';
import ReservationFilters from '@/components/admin/ReservationFilters';
import ReservationsListTable from '@/components/admin/ReservationsListTable';
import { CalendarDays } from 'lucide-react';

export default async function AdminReservationsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await searchParams;
    const status = (resolvedParams.status as string) || 'ALL';
    const query = (resolvedParams.query as string) || '';
    const page = Number(resolvedParams.page as string) || 1;

    const { data, count } = await getAdminReservations(status, query, page);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                    <CalendarDays className="w-8 h-8 text-emerald-500" />
                    Historial de <span className="text-emerald-500">Reservas</span>
                </h1>
                <p className="text-muted-foreground mt-1 text-sm font-medium">
                    Consulta y audita todas las reservas realizadas.
                </p>
            </div>

            <ReservationFilters />

            <ReservationsListTable data={data || []} />

            {/* Pagination Controls could go here */}
            {count && count > 0 && (
                <div className="text-right text-xs text-muted-foreground font-mono">
                    Mostrando {data?.length} de {count} reservas
                </div>
            )}
        </div>
    );
}
