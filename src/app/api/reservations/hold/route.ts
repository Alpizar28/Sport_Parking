import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { createAdminClient } from '@/lib/supabase'; // logic uses admin for writing holds securely
import { checkAvailability } from '@/lib/availability';
import { HOLD_DURATION_MINUTES } from '@/lib/constants';
import { toUtcRangeFromLocal } from '@/lib/time';

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
        /*
          New Payload Contract:
          {
             type: 'FIELD' | 'TABLE_ROW',
             dateLocal: 'YYYY-MM-DD',
             startHour: number,
             duration: number,
             resources: [...],
             customer_note: string
          }
        */
        const { type, dateLocal, startHour, duration, resources, customer_note, start: legacyStart } = body;

        // Basic Validations
        if (!dateLocal || startHour === undefined || !duration || !resources || !Array.isArray(resources) || resources.length === 0) {
            // Fallback for legacy calls logic ? No, user wants migration.
            return NextResponse.json(
                { error: { code: 'INVALID_REQUEST', message: 'Missing required fields (dateLocal, startHour, duration, resources)' } },
                { status: 400 }
            );
        }

        // Compute UTC Bounds from Local Venue Time
        let startUtc: string;
        let endUtc: string;
        try {
            const range = toUtcRangeFromLocal(dateLocal, startHour, duration);
            startUtc = range.startUtc;
            endUtc = range.endUtc;
        } catch (e: any) {
            return NextResponse.json(
                { error: { code: 'INVALID_DATE', message: e.message } },
                { status: 400 }
            );
        }

        const startDate = new Date(startUtc);
        const endDate = new Date(endUtc);
        const now = new Date();

        if (startDate < now) {
            return NextResponse.json(
                { error: { code: 'INVALID_DATE', message: 'Cannot reserve in the past' } },
                { status: 400 }
            );
        }

        if (duration > 4) {
            return NextResponse.json(
                { error: { code: 'RULE_VIOLATION', message: 'Reservation cannot exceed 4 hours' } },
                { status: 422 }
            );
        }

        const durationHours = duration; // Alias for reuse


        // 3a. Validate Resource Type Consistency (Hard Guard)
        // Ensure all provided resources match the reservation `type`.
        const adminSupabase = createAdminClient();
        const resourceIds = resources.map((r: any) => r.resource_id);
        const { data: dbResources } = await adminSupabase
            .from('resources')
            .select('id, type, name')
            .in('id', resourceIds);

        if (!dbResources || dbResources.length !== resourceIds.length) {
            return NextResponse.json(
                { error: { code: 'INVALID_RESOURCE', message: 'One or more resources do not exist.' } },
                { status: 400 }
            );
        }

        const invalidTypeResources = dbResources.filter(r => r.type !== type);
        if (invalidTypeResources.length > 0) {
            return NextResponse.json(
                { error: { code: 'TYPE_MISMATCH', message: `No puedes mezclar tipos. Estás reservando ${type} pero el recurso ${invalidTypeResources[0].name} es ${invalidTypeResources[0].type}.` } },
                { status: 400 }
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

        // Check active HOLDs for user (Rule: 1 active hold PER TYPE)
        const { data: activeHolds } = await adminSupabase
            .from('reservations')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', type) // Check only same type
            .in('status', ['HOLD', 'PAYMENT_PENDING'])
            .gt('hold_expires_at', now.toISOString()); // Check validity

        if (activeHolds && activeHolds.length > 0) {
            const msg = type === 'FIELD'
                ? 'Ya tienes una reserva de cancha en proceso. Completa o cancélala antes de crear otra.'
                : 'Ya tienes una reserva de mesa en proceso. Completa o cancélala antes de crear otra.';

            return NextResponse.json(
                { error: { code: 'ACTIVE_HOLD_EXISTS', message: msg } },
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

        // SECURITY CHECK FOR TABLE_ROW and FIELD
        // We already ran checkAvailability() above (step 3), which uses src/lib/availability.ts
        // That function is supposed to be robust. However, checkAvailability logic might be outdated if we haven't synced it.
        // Let's rely primarily on checkAvailability if we trust it, BUT we need to ensure checkAvailability
        // uses the correct "Capacity" logic we just fixed in route.ts (GET).

        // Wait, step 3 calls checkAvailability(startDate, endDate, resources).
        // If availability.available is false, we return 409.
        // So the fix needs to be in src/lib/availability.ts because that's what's blocking the user!

        // THE BLOCK BELOW WAS REDUNDANT AND INCORRECT FOR TABLES (It assumed ANY conflict is bad)
        // I will remove this manual conflict check and rely on a fixed checkAvailability in lib/availability.ts
        // This avoids code duplication and errors.

        // ... (Removing the manual conflict block for TABLE_ROW lines 163-199) ...


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
