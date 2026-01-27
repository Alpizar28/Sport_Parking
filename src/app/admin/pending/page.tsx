import { getPendingReservations } from '../actions';
import PendingReservationsTable from '@/components/admin/PendingReservationsTable';
import { Clock } from 'lucide-react';

export default async function AdminPendingPage() {
    const data = await getPendingReservations();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                    <Clock className="w-8 h-8 text-amber-500" />
                    Reservas <span className="text-amber-500">Pendientes</span>
                </h1>
                <p className="text-muted-foreground mt-1 text-sm font-medium">
                    Requieren revisión manual o confirmación de pago.
                </p>
            </div>

            <PendingReservationsTable data={data} />
        </div>
    );
}
