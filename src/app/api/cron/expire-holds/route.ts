import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// GET /api/cron/expire-holds
// Call this via Vercel Cron or external scheduler
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const authHeader = request.headers.get('authorization');

        // 1. Verify Secret
        // Check Authorization header "Bearer <CRON_SECRET>"
        // OR query param ?secret=<CRON_SECRET> (easier for some simple cron tools)
        const secret = process.env.CRON_SECRET;
        const receivedSecret = authHeader?.split(' ')[1] || searchParams.get('secret');

        if (receivedSecret !== secret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();

        // 2. Find Expired Reservations
        // Status: HOLD or PAYMENT_PENDING
        // hold_expires_at < NOW()
        // payment_status != PAID (This is implicit if status is HOLD/PENDING usually, 
        // but good to check payments table if we want to be extra safe. 
        // For MVP, relying on `status` not being CONFIRMED is the main check, 
        // assuming we update status atomically on payment).

        const now = new Date().toISOString();

        const { data: expiredReservations, error: findError } = await supabase
            .from('reservations')
            .select('id, status')
            .in('status', ['HOLD', 'PAYMENT_PENDING'])
            .lt('hold_expires_at', now);

        if (findError) {
            console.error('Error finding expired:', findError);
            return NextResponse.json({ error: 'DB Error' }, { status: 500 });
        }

        if (!expiredReservations || expiredReservations.length === 0) {
            return NextResponse.json({ message: 'No expired reservations found' });
        }

        const idsToExpire = expiredReservations.map(r => r.id);

        // 3. Update to EXPIRED
        const { error: updateError } = await supabase
            .from('reservations')
            .update({ status: 'EXPIRED' })
            .in('id', idsToExpire);

        if (updateError) {
            console.error('Error updating expired:', updateError);
            return NextResponse.json({ error: 'DB Update Error' }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Successfully expired reservations',
            count: idsToExpire.length,
            ids: idsToExpire
        });

    } catch (err) {
        console.error('Cron Error:', err);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
