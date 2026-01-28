import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase';
import { checkAvailability } from '@/lib/availability';
import { dayBoundsUtc, toUtcRangeFromLocal } from '@/lib/time';

// GET /api/availability
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const adminSupabase = createAdminClient(); // Bypass RLS for availability check

        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!dateStr) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }

        // ... comments ...

        // Query reservations for that day directly using UTC Bounds
        const { startUtc, endUtc } = dayBoundsUtc(dateStr);

        // Use adminSupabase for fetching reservations to see ALL of them
        // Overlap logic: start < rangeEnd AND end > rangeStart
        const { data: dayReservations, error } = await adminSupabase
            .from('reservations')
            .select(`
            id, start_time, end_time, status, hold_expires_at,
            reservation_resources(resource_id, quantity)
        `)
            .in('status', ['HOLD', 'PAYMENT_PENDING', 'CONFIRMED'])
            .lt('start_time', endUtc)
            .gt('end_time', startUtc);

        if (error) {
            console.error('DB Error fetching reservations:', error);
            return NextResponse.json({ error: 'DB Error' }, { status: 500 });
        }

        // Fetch Resources (using admin just to be safe/consistent, though public read is likely enabled)
        const { data: resources } = await adminSupabase.from('resources').select('id, name, type, capacity');
        if (!resources) throw new Error("No resources found");

        // Build the response structure (Resources list with their schedule)
        // To do this fully, we'd need to compute "slots".
        // For MVP, letting the frontend compute slots from the "busy ranges" is sometimes easier,
        // but the API contract says backend returns slots.

        // Let's implement a simplified "busy ranges" return which is easier to consume if FS is smart,
        // or generate slots if we have defined durations.
        // API Contract: "slots": [{"start":..., "status": "AVAILABLE" | "BUSY"}]

        // Let's stick to returning "raw availability data" (resources + busy ranges) for now 
        // to allow Frontend flexibility in rendering the grid, OR strictly follow contract.
        // Contract example:
        // { "resources": [ { "resource_id": "field_a", "slots": [...] } ] }

        // Generate Slots from 8:00 to 23:00 (15 slots)
        const startHour = 8;
        const endHour = 23;
        const totalSlots = endHour - startHour; // 15 slots (8 to 22 start times? or 8 to 23 end times?)
        // Let's go 8:00 to 23:00 (Last slot 22:00-23:00) => 15 slots.

        const resultResources = resources.map(res => {
            // Strictly filter reservations for this specific resource
            const resReservations = dayReservations.filter(r => {
                const rResources = r.reservation_resources;
                // Ensure rResources is an array
                if (!Array.isArray(rResources)) return false;

                // Check exact ID match
                const hasResource = rResources.some((rr: any) => String(rr.resource_id) === String(res.id));
                return hasResource;
            });

            // DEBUG: Log if we find reservations for a TABLE_ROW (which shouldn't exist per user)
            if (res.type === 'TABLE_ROW' && resReservations.length > 0) {
                console.log(`[AVAILABILITY_DEBUG] Unexpected reservation on Table ${res.name} (${res.id})`);
                resReservations.forEach(r => {
                    console.log(` - ResID: ${r.id || '?'}, Status: ${r.status}, Resources:`, JSON.stringify(r.reservation_resources));
                });
            }

            // Compute Slots
            const slots = [];
            for (let h = startHour; h < endHour; h++) {
                const timeLabel = `${h.toString().padStart(2, '0')}:00`; // "08:00"

                // Construct UTC Slot Range correctly using helper
                const slotRange = toUtcRangeFromLocal(dateStr, h, 1);
                const slotStartVal = new Date(slotRange.startUtc).getTime();
                const slotEndVal = new Date(slotRange.endUtc).getTime();

                if (isNaN(slotStartVal) || isNaN(slotEndVal)) {
                    slots.push({ time: timeLabel, status: 'AVAILABLE', detail: 'Invalid Date' });
                    continue;
                }

                // Calculate Used Capacity for this slot
                let usedCapacity = 0;
                let blockingStatusDetails: string | null = null;

                // Check overlapping reservations
                for (const r of resReservations) {
                    const rStart = new Date(r.start_time).getTime();
                    const rEnd = new Date(r.end_time).getTime();

                    if (isNaN(rStart) || isNaN(rEnd)) continue;

                    // Strict Overlap Check
                    const overlap = (Math.max(rStart, slotStartVal) < Math.min(rEnd, slotEndVal));
                    if (!overlap) continue;

                    // Validate Status Validity
                    let isValid = false;
                    if (r.status === 'CONFIRMED' || r.status === 'PAYMENT_PENDING') {
                        isValid = true;
                    } else if (r.status === 'HOLD') {
                        if (r.hold_expires_at) {
                            const expires = new Date(r.hold_expires_at).getTime();
                            if (expires > new Date().getTime()) isValid = true; // Valid hold
                        }
                    }

                    if (isValid) {
                        // Get quantity specific to this resource
                        const rr = (r.reservation_resources as any[]).find((i: any) => String(i.resource_id) === String(res.id));
                        const qty = rr ? (rr.quantity || 1) : 1;
                        usedCapacity += qty;

                        // Keep track of status for UI coloring (prioritize CONFIRMED)
                        if (!blockingStatusDetails || r.status === 'CONFIRMED') {
                            blockingStatusDetails = r.status;
                        }
                    }
                }

                // Determine Final Status based on Capacity
                let status = 'AVAILABLE';
                if (usedCapacity >= res.capacity) {
                    // Fully booked
                    if (blockingStatusDetails === 'CONFIRMED') status = 'CONFIRMED';
                    else if (blockingStatusDetails === 'HOLD' || blockingStatusDetails === 'PAYMENT_PENDING') status = 'HOLD';
                    else status = 'HOLD'; // Fallback
                }

                // For FIELDs usually capacity is 1, so usedCapacity >= 1 means busy.
                // For TABLEs capacity > 1, so usedCapacity needs to reach capacity.

                slots.push({
                    time: timeLabel,
                    status: status,
                    detail: status !== 'AVAILABLE' ? blockingStatusDetails : undefined
                });
            }

            return {
                resource_id: res.id,
                name: res.name,
                type: res.type,
                capacity: res.capacity,
                slots: slots
            };
        });

        // Add Cache-Control header to prevent stale UI
        return NextResponse.json({
            date: dateStr,
            resources: resultResources
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0'
            }
        });

    } catch (err: any) {
        console.error('CRITICAL AVAILABILITY ERROR:', err);
        return NextResponse.json({ error: 'Internal Error', details: err.message }, { status: 500 });
    }
}
