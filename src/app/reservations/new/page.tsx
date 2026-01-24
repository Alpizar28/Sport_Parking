import { createClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import ReservationFlow from '@/components/reservation/ReservationFlow';

export default async function NewReservationPage({
    searchParams,
}: {
    searchParams: Promise<{ type?: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { type } = await searchParams;
    const initialType = type === 'EVENT' ? 'EVENT' : 'FIELD';

    // Page wrapper is clean, layout is handled inside ReservationFlow (using ReservationLayout)
    // or we could wrap here. Since ReservationFlow manages the "Back" logic which depends on router/step state,
    // it's better if the Layout is part of the Flow component or wraps the content.
    // The ReservationFlow now renders the full Layout.
    return <ReservationFlow initialType={initialType} />;
}
