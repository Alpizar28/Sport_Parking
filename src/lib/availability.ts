import { createAdminClient } from './supabase';

type ResourceRequest = {
    resource_id: string;
    quantity: number;
};

export type AvailabilityResult = {
    available: boolean;
    reason?: string;
    conflicting_reservation_id?: string;
};

/**
 * Checks if the requested resources are available for the given time range.
 * This runs on the server side using the Admin Client to ensure we see ALL reservations
 * regardless of RLS (though RLS should allow reading conflicts usually, Admin is safer for system logic).
 */
export async function checkAvailability(
    start: Date,
    end: Date,
    resources: ResourceRequest[]
): Promise<AvailabilityResult> {
    const supabase = createAdminClient();
    const startIso = start.toISOString();
    const endIso = end.toISOString();

    // 1. Validate basic time logic
    if (start >= end) {
        return { available: false, reason: 'End time must be after start time' };
    }

    // 2. Get resources info (capacity)
    const resourceIds = resources.map((r) => r.resource_id);
    const { data: resourceInfos, error: resError } = await supabase
        .from('resources')
        .select('id, capacity, type')
        .in('id', resourceIds);

    if (resError || !resourceInfos) {
        console.error('Error fetching resources:', resError);
        return { available: false, reason: 'Error validating resources' };
    }

    // Verify all resources exist
    if (resourceInfos.length !== resourceIds.length) {
        return { available: false, reason: 'One or more invalid resources' };
    }

    // 3. Find overlapping reservations
    // A reservation overlaps if: (start < requested_end) AND (end > requested_start)
    // Statuses that block: HOLD, PAYMENT_PENDING, CONFIRMED
    // Ignored: CANCELLED, EXPIRED
    const { data: conflicts, error: conflictError } = await supabase
        .from('reservations')
        .select(`
      id,
      status,
      start_time,
      end_time,
      reservation_resources!inner (
        resource_id,
        quantity
      )
    `)
        .in('status', ['HOLD', 'PAYMENT_PENDING', 'CONFIRMED'])
        .lt('start_time', endIso)
        .gt('end_time', startIso);

    if (conflictError) {
        console.error('Error fetching conflicts:', conflictError);
        return { available: false, reason: 'Database error checking conflicts' };
    }

    // 4. Calculate usage per resource
    // Map<resource_id, used_quantity>
    const usageMap = new Map<string, number>();

    // Fill usage from conflicts
    if (conflicts) {
        for (const res of conflicts) {
            // @ts-ignore - supabase types might be loose here without full generation
            const resResources = res.reservation_resources as any[];
            for (const rr of resResources) {
                if (resourceIds.includes(rr.resource_id)) {
                    const current = usageMap.get(rr.resource_id) || 0;
                    usageMap.set(rr.resource_id, current + rr.quantity);
                }
            }
        }
    }

    // 5. Check against capacity
    for (const req of resources) {
        const info = resourceInfos.find((r) => r.id === req.resource_id)!;
        const used = usageMap.get(req.resource_id) || 0;
        const requested = req.quantity;

        if (used + requested > info.capacity) {
            // Special case for FIELDS: usually capacity 1.
            // If it's a field and used > 0, it's busy.
            if (info.type === 'FIELD') {
                return { available: false, reason: `Resource ${info.name} is already booked` };
            }
            return {
                available: false,
                reason: `Not enough capacity for ${info.name}. Requested: ${requested}, Available: ${info.capacity - used}`
            };
        }
    }

    return { available: true };
}
