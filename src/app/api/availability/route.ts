import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase';
import { checkAvailability } from '@/lib/availability';

// GET /api/availability
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

        // Query reservations for that day directly.
        const startOfDay = `${dateStr}T00:00:00`;
        const endOfDay = `${dateStr}T23:59:59`;

        // Use adminSupabase for fetching reservations to see ALL of them
        const { data: dayReservations, error } = await adminSupabase
            .from('reservations')
            .select(`
            start_time, end_time, status, hold_expires_at,
            reservation_resources(resource_id, quantity)
        `)
            .in('status', ['HOLD', 'PAYMENT_PENDING', 'CONFIRMED'])
            .gte('end_time', startOfDay) // Overlap logic
            .lte('start_time', endOfDay); // Overlap logic

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
            const resReservations = dayReservations.filter(r =>
                // @ts-ignore
                Array.isArray(r.reservation_resources) && r.reservation_resources.some((rr: any) => rr.resource_id === res.id)
            );

            // Compute Slots
            const slots = [];
            for (let h = startHour; h < endHour; h++) {
                const timeLabel = `${h.toString().padStart(2, '0')}:00`; // "08:00"

                // Check if this hour is busy
                // Check if this hour is busy
                // Find conflicting reservation
                const busyRes = resReservations.find(r => {
                    const rStart = new Date(r.start_time);
                    const rEnd = new Date(r.end_time);

                    if (isNaN(rStart.getTime()) || isNaN(rEnd.getTime())) return false;

                    const nextH = h + 1;
                    const nextTimeLabel = `${nextH.toString().padStart(2, '0')}:00`;

                    // Force Panama dates for safety
                    const slotStartVal = new Date(`${dateStr}T${timeLabel}:00`).getTime();
                    const slotEndVal = new Date(`${dateStr}T${nextTimeLabel}:00`).getTime();

                    if (isNaN(slotStartVal) || isNaN(slotEndVal)) return false;

                    const overlap = (Math.max(rStart.getTime(), slotStartVal) < Math.min(rEnd.getTime(), slotEndVal));
                    if (!overlap) return false;

                    // If overlap, check status validity
                    if (r.status === 'CONFIRMED' || r.status === 'PAYMENT_PENDING') return true;
                    if (r.status === 'HOLD') {
                        if (!r.hold_expires_at) return false; // No expiry = invalid/expired/legacy hold that shouldn't block
                        const expires = new Date(r.hold_expires_at);
                        if (expires.getTime() > new Date().getTime()) return true; // Valid hold
                        return false; // Expired
                    }
                    return false;
                });

                let status = 'AVAILABLE';
                if (busyRes) {
                    if (busyRes.status === 'CONFIRMED') status = 'CONFIRMED';
                    else if (busyRes.status === 'HOLD' || busyRes.status === 'PAYMENT_PENDING') status = 'HOLD';
                }

                slots.push({
                    time: timeLabel,
                    status: status,
                    detail: busyRes?.status
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

        return NextResponse.json({
            date: dateStr,
            resources: resultResources
        });

    } catch (err: any) {
        console.error('CRITICAL AVAILABILITY ERROR:', err);
        return NextResponse.json({ error: 'Internal Error', details: err.message }, { status: 500 });
    }
}
