import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// GET /api/reservations/me
export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: reservations, error } = await supabase
        .from('reservations')
        .select('*, reservation_resources(*)')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

    if (error) return NextResponse.json({ error: 'DB Error' }, { status: 500 });

    return NextResponse.json({ reservations });
}
