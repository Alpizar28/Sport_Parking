import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { createAdminClient } from '@/lib/supabase';

// POST /api/admin/reservations/[id]/cancel
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Admin Check
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use Admin Client to bypass RLS/ensure write
    const adminDb = createAdminClient();

    // Cancel logic: Update status to CANCELLED.
    // Optional: Refund logic is out of scope for MVP auto-refund, but we should log it.

    const { error } = await adminDb
        .from('reservations')
        .update({ status: 'CANCELLED' })
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: 'Update Failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
