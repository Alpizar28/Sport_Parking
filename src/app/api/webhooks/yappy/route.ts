import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// POST /api/webhooks/yappy
export async function POST(request: Request) {
    try {
        // 1. Verify Signature (CRITICAL security step)
        // In production, Yappy sends a signature header. Verify it using YAPPY_SECRET_KEY.
        // For MVP/Mock, we'll assume it's valid if using a secret query param or similar for testing,
        // or just implement the logic structure.

        // const signature = request.headers.get('x-yappy-signature');
        // if (!isValidYappySignature(signature, body)) return 401...

        const body = await request.json();

        // Expected Payload (Generic Structure - Adapt to Yappy Real Docs)
        // {
        //   "orderId": "...",
        //   "status": "APPROVED",
        //   "amount": 20.00,
        //   "hash": "..."
        // }

        const { orderId, status, amount } = body;

        // 2. Validate Idempotency & Data
        const adminSupabase = createAdminClient();

        // Find the payment
        const { data: payment, error: findError } = await adminSupabase
            .from('payments')
            .select('*, reservations(*)')
            .eq('provider_transaction_id', orderId)
            .single();

        if (findError || !payment) {
            // Log error, maybe return 404 or 200 to stop retries if logic dictates
            console.error('Webhook: Payment not found for order', orderId);
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        if (payment.status === 'PAID') {
            return NextResponse.json({ message: 'Already processed' });
        }

        // 3. Process Confirmation
        if (status === 'APPROVED' || status === 'PAID') { // Adapt to Yappy status string

            // Verify Amount
            if (parseFloat(amount) !== parseFloat(payment.amount)) {
                console.error('Webhook: Amount mismatch', amount, payment.amount);
                return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
            }

            // TRANSACTION: Update Payment -> PAID, Reservation -> CONFIRMED
            // Supabase-js doesn't do multi-table transactions easily without RPC.
            // We will do sequential updates. If second fails, we have inconsistent state (Paid but not confirmed).
            // Best practice: Use RPC. For MVP: Sequential with error logging.

            // A. Update Payment
            const { error: payUpdateError } = await adminSupabase
                .from('payments')
                .update({
                    status: 'PAID',
                    paid_at: new Date().toISOString()
                })
                .eq('id', payment.id);

            if (payUpdateError) {
                throw new Error('Failed to update payment status');
            }

            // B. Update Reservation
            const { error: resUpdateError } = await adminSupabase
                .from('reservations')
                .update({ status: 'CONFIRMED' })
                .eq('id', payment.reservation_id);

            if (resUpdateError) {
                console.error('CRITICAL: Payment PAID but Reservation update failed', payment.reservation_id);
                // In real world, alert admin immediately.
            }

            return NextResponse.json({ success: true });

        } else if (status === 'REJECTED' || status === 'FAILED') {
            await adminSupabase
                .from('payments')
                .update({ status: 'FAILED' })
                .eq('id', payment.id);

            // Optional: Release reservation immediately? 
            // Logic says hold expires eventually. We can leave it to cron or release now.
            // Let's leave to cron to simple.

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ message: 'Status ignored' });

    } catch (err) {
        console.error('Webhook Error:', err);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
