import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { createAdminClient } from '@/lib/supabase'; // logic uses admin for writing holds securely
import { checkAvailability } from '@/lib/availability';
import { HOLD_DURATION_MINUTES } from '@/lib/constants';

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

        // Calculate expiration (10 mins from now standardized)
        const expiresAt = new Date(now.getTime() + HOLD_DURATION_MINUTES * 60 * 1000);

        // Calculate Amount (MOCK PRICING LOGIC - MVP)
        let totalAmount = 0;
        let status = 'HOLD';

        if (type === 'TABLE_ROW') {
            // Tables are free and auto-confirmed
            totalAmount = 0;
            status = 'CONFIRMED';
        } else {
            // Fields logic
            for (const res of resources) {
                // Determine price based on resource type or ID logic
                // For MVP, if it passes as FIELD, we charge.
                // Assuming all resources passed in this call match the 'type'

                // Fallback pricing if not explicit
                totalAmount += 35 * durationHours * res.quantity;
            }
        }

        // SECURITY CHECK FOR TABLE_ROW (STRICT NO OVERLAP)
        if (type === 'TABLE_ROW') {
            const resourceIds = resources.map((r: any) => r.resource_id);

            // Check if selected resources are booked in conflicting status
            // Using adminSupabase to see ALL reservations
            const { data: conflicts } = await adminSupabase
                .from('reservation_resources')
                .select(`
                    reservation_id,
                    reservations!inner (
                        status, start_time, end_time, hold_expires_at
                    )
                `)
                .in('resource_id', resourceIds)
                .in('reservations.status', ['CONFIRMED', 'PAYMENT_PENDING', 'HOLD'])
                .filter('reservations.start_time', 'lt', endDate.toISOString())
                .filter('reservations.end_time', 'gt', startDate.toISOString());

            // Filter out expired HOLDs
            const activeConflicts = conflicts?.filter((c: any) => {
                const r = c.reservations;
                if (r.status === 'CONFIRMED' || r.status === 'PAYMENT_PENDING') return true;
                if (r.status === 'HOLD') {
                    if (!r.hold_expires_at) return false;
                    if (new Date(r.hold_expires_at) > new Date()) return true; // Active hold
                    return false; // Expired
                }
                return false;
            });

            if (activeConflicts && activeConflicts.length > 0) {
                return NextResponse.json(
                    { error: { code: 'CONFLICT', message: 'Una o más mesas seleccionadas ya no están disponibles.' } },
                    { status: 409 }
                );
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
                status: status,
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
