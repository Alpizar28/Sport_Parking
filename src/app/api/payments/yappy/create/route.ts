import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { createAdminClient } from '@/lib/supabase';

// POST /api/payments/yappy/create
export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Auth Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
        }

        // 2. Body: reservation_id
        const { reservation_id } = await request.json();
        if (!reservation_id) {
            return NextResponse.json({ error: { code: 'INVALID_REQUEST' } }, { status: 400 });
        }

        // 3. Get Reservation
        const { data: reservation, error: fetchError } = await supabase
            .from('reservations')
            .select('*')
            .eq('id', reservation_id)
            .eq('user_id', user.id) // Security check
            .single();

        if (fetchError || !reservation) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Reservation not found' } }, { status: 404 });
        }

        // 4. Validate State
        if (reservation.status !== 'HOLD' && reservation.status !== 'PAYMENT_PENDING') {
            return NextResponse.json({
                error: { code: 'INVALID_STATE', message: 'Reservation is not in a payable state' }
            }, { status: 409 });
        }

        // Check expiration
        if (new Date(reservation.hold_expires_at) < new Date()) {
            return NextResponse.json({
                error: { code: 'RESERVATION_EXPIRED', message: 'Time to complete payment has expired' }
            }, { status: 409 });
        }

        // 5. Call Yappy API (Mock for now, or Placeholder)
        const amount = reservation.deposit_amount;
        const orderId = `yappy-${Date.now()}-${reservation.id.slice(0, 8)}`; // Mock ID

        // TODO: Real Call to Yappy
        // const yappyResponse = await fetch(process.env.YAPPY_BG_URL, { ... })
        // const checkoutUrl = yappyResponse.url;
        const checkoutUrl = `https://pagosbg.yappy.com.pa/fake-checkout/${orderId}`; // Placeholder

        // 6. Record Payment Intent (PENDING)
        const adminSupabase = createAdminClient();

        // Insert new payment record
        const { data: payment, error: payInsertError } = await adminSupabase
            .from('payments')
            .insert({
                reservation_id: reservation.id,
                provider: 'YAPPY',
                provider_transaction_id: orderId, // Or whatever Yappy gives us initially
                amount: amount,
                status: 'PENDING'
            })
            .select()
            .single();

        if (payInsertError) {
            console.error('Payment Insert Error:', payInsertError);
            return NextResponse.json({ error: { code: 'INTERNAL_ERROR' } }, { status: 500 });
        }

        // 7. Update Reservation Status to PAYMENT_PENDING (if it was HOLD)
        if (reservation.status === 'HOLD') {
            await adminSupabase
                .from('reservations')
                .update({ status: 'PAYMENT_PENDING' })
                .eq('id', reservation.id);
        }

        return NextResponse.json({
            payment_id: payment.id,
            checkout_url: checkoutUrl
        });

    } catch (err) {
        console.error('Create Payment Error:', err);
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR' } }, { status: 500 });
    }
}
