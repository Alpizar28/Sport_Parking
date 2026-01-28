import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase';
import { checkAvailability } from '@/lib/availability';

// POST /api/admin/blocks
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Admin Check
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { start, end, resources, note } = await request.json();

    // Reuse CheckAvailability? 
    // Admin blocks usually FORCE blocking.
    // But if we want to be safe, we check.
    // API Contract says "409 NOT_AVAILABLE (si choca con reservas confirmadas)".

    const startDate = new Date(start);
    const endDate = new Date(end);

    const availability = await checkAvailability(startDate, endDate, resources);
    if (!availability.available) {
        return NextResponse.json({ error: 'Conflict with existing reservations', details: availability.reason }, { status: 409 });
    }

    const adminDb = createAdminClient();

    // Create a reservation of type 'FIELD' or special type.
    // The schema has enum 'reservation_type': 'FIELD', 'EVENT'.
    // We can add 'BLOCK' or just use 'EVENT' with a note "ADMIN BLOCK".
    // Let's use 'EVENT' for now as generic, or better, stick to schema limits.
    // I will use 'EVENT' and a specific user_id (the admin's).

    const { data: reservation, error } = await adminDb
        .from('reservations')
        .insert({
            user_id: user.id,
            type: 'EVENT', // Generic
            start_time: start,
            end_time: end,
            status: 'CONFIRMED', // Blocks are confirmed immediately
            total_amount: 0,
            deposit_amount: 0,
            customer_note: `ADMIN BLOCK: ${note || ''}`
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: 'Failed to create block' }, { status: 500 });
    }

    // Insert Resources link
    const resourceLinks = resources.map((r: any) => ({
        reservation_id: reservation.id,
        resource_id: r.resource_id,
        quantity: r.quantity
    }));

    await adminDb.from('reservation_resources').insert(resourceLinks);

    return NextResponse.json({ block: reservation }, { status: 201 });
}
