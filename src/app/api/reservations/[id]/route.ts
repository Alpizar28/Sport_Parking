import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// GET /api/reservations/[id]
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: reservation, error } = await supabase
        .from('reservations')
        .select('*, reservation_resources(*), payments(*)')
        .eq('id', id)
        .single();

    if (error || !reservation) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    // Security: RLS handles it, but explicit check doesn't hurt
    if (reservation.user_id !== user.id) {
        // Check if admin? For now, this is client endpoint.
        // If admin needs to view, he uses admin endpoint or this one if permitted.
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ reservation });
}
