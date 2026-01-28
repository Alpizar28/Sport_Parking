import { createClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import ReservationFlow from '@/components/reservation/ReservationFlow';

export default async function NewReservationPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return <ReservationFlow />;
}
