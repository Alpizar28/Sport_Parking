import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { createAdminClient } from '@/lib/supabase';
import { checkAvailability } from '@/lib/availability';
import { HOLD_DURATION_MINUTES } from '@/lib/constants';
import { toUtcRangeFromLocal } from '@/lib/time';

// Security headers
const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Input sanitization
function sanitizeString(input: string): string {
    return input.trim().replace(/[<>"']/g, '');
}

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
          Payload Contract:
          {
             type: 'FIELD' | 'EVENT',
             dateLocal: 'YYYY-MM-DD',
             startHour: number,
             duration: number,
             resources: [...],
             customer_note: string
          }
        */
        const { type, dateLocal, startHour, duration, resources, customer_note } = body;

        // Input Validation & Sanitization
        if (!dateLocal || startHour === undefined || !duration || !resources || !Array.isArray(resources) || resources.length === 0) {
            return NextResponse.json(
                { error: { code: 'INVALID_REQUEST', message: 'Missing required fields' } },
                { status: 400, headers: SECURITY_HEADERS }
            );
        }

        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateLocal)) {
            return NextResponse.json(
                { error: { code: 'INVALID_DATE_FORMAT', message: 'Date must be in YYYY-MM-DD format' } },
                { status: 400, headers: SECURITY_HEADERS }
            );
        }

        // Validate numeric inputs
        if (!Number.isInteger(startHour) || startHour < 0 || startHour > 23) {
            return NextResponse.json(
                { error: { code: 'INVALID_HOUR', message: 'Start hour must be between 0 and 23' } },
                { status: 400, headers: SECURITY_HEADERS }
            );
        }

        if (!Number.isInteger(duration) || duration < 1 || duration > 24) {
            return NextResponse.json(
                { error: { code: 'INVALID_DURATION', message: 'Duration must be between 1 and 24 hours' } },
                { status: 400, headers: SECURITY_HEADERS }
            );
        }

        // Validate resources array
        if (resources.length > 10) {
            return NextResponse.json(
                { error: { code: 'TOO_MANY_RESOURCES', message: 'Maximum 10 resources per reservation' } },
                { status: 400, headers: SECURITY_HEADERS }
            );
        }

        // Sanitize customer note
        const sanitizedNote = customer_note ? sanitizeString(customer_note).substring(0, 500) : '';

        // STRICT: Only allow FIELD reservations now
        if (type !== 'FIELD' && type !== 'EVENT') {
            return NextResponse.json(
                { error: { code: 'INVALID_TYPE', message: 'Only FIELD reservations are supported.' } },
                { status: 400, headers: SECURITY_HEADERS }
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

        const durationHours = duration;

        // 3a. Validate Resource Existence & Type
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

        // Ensure resources are FIELD
        const invalidTypeResources = dbResources.filter(r => r.type !== 'FIELD');
        if (invalidTypeResources.length > 0) {
            return NextResponse.json(
                { error: { code: 'TYPE_MISMATCH', message: `All resources must be FIELDS.` } },
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

        // 4. Create HOLD
        // Rule: 1 active hold/pending per user for FIELDS
        const { data: activeHolds } = await adminSupabase
            .from('reservations')
            .select('id')
            .eq('user_id', user.id)
            .in('status', ['HOLD', 'PAYMENT_PENDING'])
            .gt('hold_expires_at', now.toISOString());

        if (activeHolds && activeHolds.length > 0) {
            return NextResponse.json(
                { error: { code: 'ACTIVE_HOLD_EXISTS', message: 'Ya tienes una reserva en proceso. Completa o cancélala antes de crear otra.' } },
                { status: 409 }
            );
        }

        // Calculate Pricing (MVP: $35/hr)
        let totalAmount = 0;
        for (const res of resources) {
            totalAmount += 35 * durationHours * res.quantity;
        }
        const depositAmount = totalAmount * 0.50;

        const expiresAt = new Date(now.getTime() + HOLD_DURATION_MINUTES * 60 * 1000);

        // Insert Reservation (Always FIELD)
        const { data: reservation, error: insertError } = await adminSupabase
            .from('reservations')
            .insert({
                user_id: user.id,
                type: 'FIELD',
                start_time: startDate.toISOString(),
                end_time: endDate.toISOString(),
                status: 'HOLD',
                hold_expires_at: expiresAt.toISOString(),
                total_amount: totalAmount,
                deposit_amount: depositAmount,
                customer_note: sanitizedNote
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
        }, { status: 201, headers: SECURITY_HEADERS });

    } catch (err) {
        console.error('Unexpected Error:', err);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' } },
            { status: 500 }
        );
    }
}
