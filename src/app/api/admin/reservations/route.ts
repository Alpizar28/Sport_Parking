import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// GET /api/admin/reservations
export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin Check
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    let query = supabase.from('reservations').select('*, reservation_resources(*), profiles(email)');

    if (date) {
        const startOfDay = `${date}T00:00:00`;
        const endOfDay = `${date}T23:59:59`;
        // Overlap or Start within day? Usually list by start time for admin day view.
        query = query.gte('start_time', startOfDay).lte('start_time', endOfDay);
    }

    query = query.order('start_time', { ascending: true });

    const { data: reservations, error } = await query;

    if (error) {
        return NextResponse.json({ error: 'DB Error' }, { status: 500 });
    }

    return NextResponse.json({ reservations });
}
