import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { createAdminClient } from '@/lib/supabase'; // logic uses admin for writing holds securely
import { checkAvailability } from '@/lib/availability';

// POST /api/reservations/hold
export async function POST(request: Request) {
    try {
        const supabase = await createClient(); // Context-aware client for Auth

        // 1. Auth Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: 'You must be logged in to reserve' } },
                { status: 401 }
            );
        }

        // 2. Parse Body
        const body = await request.json();
        const { type, start, end, resources, customer_note } = body;

        // Basic Validations
        if (!start || !end || !resources || !Array.isArray(resources) || resources.length === 0) {
            return NextResponse.json(
                { error: { code: 'INVALID_REQUEST', message: 'Missing required fields' } },
                { status: 400 }
            );
        }

        const startDate = new Date(start);
        const endDate = new Date(end);
        const now = new Date();

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return NextResponse.json(
                { error: { code: 'INVALID_DATE', message: 'Invalid date format' } },
                { status: 400 }
            );
        }

        if (startDate < now) {
            return NextResponse.json(
                { error: { code: 'INVALID_DATE', message: 'Cannot reserve in the past' } },
                { status: 400 }
            );
        }

        if (endDate <= startDate) {
            return NextResponse.json(
                { error: { code: 'INVALID_RANGE', message: 'End date must be after start date' } },
                { status: 400 }
            );
        }

        // Validate Duration & Hourly Blocks (STRICT)
        // 1. Minutes/Seconds must be 0
        if (startDate.getUTCMinutes() !== 0 || startDate.getUTCSeconds() !== 0 || startDate.getUTCMilliseconds() !== 0 ||
            endDate.getUTCMinutes() !== 0 || endDate.getUTCSeconds() !== 0 || endDate.getUTCMilliseconds() !== 0) {
            return NextResponse.json(
                { error: { code: 'RULE_VIOLATION', message: 'Solo se permiten reservas en horas enteras. (Ej: 18:00 a 19:00)' } },
                { status: 422 }
            );
        }

        const durationMs = endDate.getTime() - startDate.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);

        // 2. Duration must be integer hours
        if (!Number.isInteger(durationHours)) {
            return NextResponse.json(
                { error: { code: 'RULE_VIOLATION', message: 'La duración debe ser en bloques de 1 hora exacta.' } },
                { status: 422 }
            );
        }

        if (durationHours > 4) {
            return NextResponse.json(
                { error: { code: 'RULE_VIOLATION', message: 'Reservation cannot exceed 4 hours' } },
                { status: 422 }
            );
        }


        // 3. Availability Check
        const availability = await checkAvailability(startDate, endDate, resources);
        if (!availability.available) {
            return NextResponse.json(
                { error: { code: 'NOT_AVAILABLE', message: availability.reason } },
                { status: 409 }
            );
        }

        // 4. Create HOLD (Transaction simulation)
        const adminSupabase = createAdminClient();

        // Check active HOLDs for user (Rule: 1 active hold per user)
        const { data: activeHolds } = await adminSupabase
            .from('reservations')
            .select('id')
            .eq('user_id', user.id)
            .in('status', ['HOLD', 'PAYMENT_PENDING'])
            .gt('hold_expires_at', now.toISOString()); // Check validity

        if (activeHolds && activeHolds.length > 0) {
            return NextResponse.json(
                { error: { code: 'ACTIVE_HOLD_EXISTS', message: 'Ya tienes una reserva en proceso. Completa o cancélala antes de crear otra.' } },
                { status: 409 }
            );
        }

        // Calculate expiration (15 mins from now)
        const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

        // Calculate Amount (MOCK PRICING LOGIC - MVP)
        // In a real app we'd fetch prices from DB.
        // MVP Rule: Field = $40/hr, Tables = $10 (flat) - JUST AN EXAMPLE
        // We should probably rely on a prices table or hardcoded map for MVP.
        // Let's assume a simple logic or receive from client (BAD PRACTICE, but if validated).
        // Better: Hardcoded simple map.
        let totalAmount = 0;

        // Simple Pricing Mock
        for (const res of resources) {
            if (res.resource_id.includes('field')) {
                totalAmount += 40 * durationHours;
            } else if (res.resource_id.includes('table')) {
                totalAmount += 10 * res.quantity;
            }
        }
        const depositAmount = totalAmount * 0.50;


        // Insert Reservation
        const { data: reservation, error: insertError } = await adminSupabase
            .from('reservations')
            .insert({
                user_id: user.id,
                type,
                start_time: startDate.toISOString(),
                end_time: endDate.toISOString(),
                status: 'HOLD',
                hold_expires_at: expiresAt.toISOString(),
                total_amount: totalAmount,
                deposit_amount: depositAmount,
                customer_note
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert Reservation Error:', insertError);
            return NextResponse.json(
                { error: { code: 'INTERNAL_ERROR', message: 'Failed to create reservation' } },
                { status: 500 }
            );
        }

        // Insert Resources link
        const resourceLinks = resources.map((r: any) => ({
            reservation_id: reservation.id,
            resource_id: r.resource_id,
            quantity: r.quantity
        }));

        const { error: resourcesError } = await adminSupabase
            .from('reservation_resources')
            .insert(resourceLinks);

        if (resourcesError) {
            // Rollback attempt (delete reservation)
            await adminSupabase.from('reservations').delete().eq('id', reservation.id);

            console.error('Insert Resources Error:', resourcesError);
            return NextResponse.json(
                { error: { code: 'INTERNAL_ERROR', message: 'Failed to link resources' } },
                { status: 500 }
            );
        }

        // Return Success
        return NextResponse.json({
            reservation: {
                ...reservation,
                resources: resources
            }
        }, { status: 201 });

    } catch (err) {
        console.error('Unexpected Error:', err);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' } },
            { status: 500 }
        );
    }
}
