import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const adminSupabase = createAdminClient();

        // 1. Auth Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Validate Admin Role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 3. Parse Params
        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');

        if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return NextResponse.json({ error: 'Invalid date format (YYYY-MM-DD)' }, { status: 400 });
        }

        if (isNaN(new Date(dateStr).getTime())) {
            return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
        }

        // 4. Define Range (Full Day)
        const startOfDay = `${dateStr}T00:00:00`;
        const endOfDay = `${dateStr}T23:59:59`;

        // 5. Fetch Data (Parallel)
        // We use adminSupabase for reservations to ensure we see EVERYTHING regardless of RLS policies for simple users
        const [resourcesRes, reservationsRes] = await Promise.all([
            adminSupabase
                .from('resources')
                .select('id, name, type')
                .order('name'),
            adminSupabase
                .from('reservations')
                .select(`
                    id, start_time, end_time, status, hold_expires_at,
                    reservation_resources!inner(resource_id)
                `)
                .in('status', ['HOLD', 'PAYMENT_PENDING', 'CONFIRMED'])
                .lte('start_time', endOfDay)
                .gte('end_time', startOfDay)
        ]);

        if (resourcesRes.error) throw resourcesRes.error;
        if (reservationsRes.error) throw reservationsRes.error;

        // 6. Map Data to Minimal Format
        const reservations = reservationsRes.data.map((r: any) => ({
            id: r.id,
            start: r.start_time,
            end: r.end_time,
            status: r.status,
            expiresAt: r.hold_expires_at,
            resourceIds: r.reservation_resources.map((rr: any) => rr.resource_id)
        }));

        return NextResponse.json({
            date: dateStr,
            resources: resourcesRes.data,
            reservations
        });

    } catch (err: any) {
        console.error('Calendar API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
