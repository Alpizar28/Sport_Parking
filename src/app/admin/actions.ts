'use server';

import { createClient, createAdminClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// Helper: Ensure Admin Access (Security Check)
async function requireAdmin() {
    const supabase = await createClient(); // Standard client for auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Secure Check
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'ADMIN') throw new Error('Forbidden: Admin Access Required');
    return { user, supabase }; // Return the authenticated client too
}

// Helper: Check and expire outdated pending reservations
async function checkAndExpireReservations(supabase: any) {
    try {
        const nowIso = new Date().toISOString();
        const { error } = await supabase
            .from('reservations')
            .update({ status: 'CANCELLED' })
            .in('status', ['HOLD', 'PAYMENT_PENDING'])
            .lt('start_time', nowIso);

        if (error) console.error('Auto-expire warning:', error.message);
    } catch (e) {
        console.error('Auto-expire failed completely:', e);
    }
}

export async function getAdminStats() {
    try {
        await requireAdmin();

        // Try Admin Client first
        let supabase = createAdminClient();
        let usingAdminClient = true;

        // Verify if Admin Client works (simple health check)
        const { error: healthCheck } = await supabase.from('profiles').select('id').limit(1);
        if (healthCheck) {
            console.error('⚠️ Admin Client Failed (Check SUPABASE_SERVICE_ROLE_KEY). Falling back to standard client.', healthCheck);
            supabase = (await requireAdmin()).supabase;
            usingAdminClient = false;
        }

        const todayStr = new Date().toISOString().split('T')[0];

        // Only try auto-expire if using admin client (standard client might have RLS blocks for updates)
        if (usingAdminClient) {
            await checkAndExpireReservations(supabase);
        }

        // 1. Today's Reservations Count
        const { count: todayCount } = await supabase
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .gte('start_time', `${todayStr}T00:00:00`)
            .lt('start_time', `${todayStr}T23:59:59`)
            .neq('status', 'CANCELLED');

        // 2. Pending Count
        const { count: pendingCount } = await supabase
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .in('status', ['HOLD', 'PAYMENT_PENDING']);

        // 3. Confirmed Recent
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const { count: confirmedWeek } = await supabase
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .gte('start_time', lastWeek.toISOString())
            .eq('status', 'CONFIRMED');

        // 4. Upcomings
        // Safe query building: only join profiles if using admin client or if we know RLS allows it
        let upcomingQuery = supabase
            .from('reservations')
            .select(usingAdminClient
                ? `id, start_time, end_time, status, type, total_amount, reservation_resources(resources(name)), profiles(full_name, email)`
                : `id, start_time, end_time, status, type, total_amount, reservation_resources(resources(name))`
            )
            .gte('start_time', new Date().toISOString())
            .lt('start_time', `${todayStr}T23:59:59`)
            .neq('status', 'CANCELLED')
            .order('start_time', { ascending: true })
            .limit(8);

        const { data: upcomingToday } = await upcomingQuery;

        return {
            todayCount: todayCount || 0,
            pendingCount: pendingCount || 0,
            confirmedWeek: confirmedWeek || 0,
            upcomingToday: upcomingToday || []
        };
    } catch (e) {
        console.error('getAdminStats Critical Error:', e);
        return null;
    }
}

export async function getAdminReservations(statusFilter?: string, query?: string, page = 1) {
    const authSession = await requireAdmin();
    let supabase = createAdminClient();
    let usingAdminClient = true;

    // Check availability of Service Key
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('Missing SUPABASE_SERVICE_ROLE_KEY. Using authenticated client.');
        supabase = authSession.supabase;
        usingAdminClient = false;
    }

    if (usingAdminClient) {
        await checkAndExpireReservations(supabase);
    }

    const PAGE_SIZE = 20;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Build Select Query
    // Note: If using standard client, 'profiles' join usually fails due to RLS unless 'profiles' is publicly readable.
    // We will attempt it, but catch errors.
    const selectString = `
        *,
        reservation_resources(resources(name))
        ${usingAdminClient ? ', profiles(full_name, email)' : ''}
    `;

    let dbQuery = supabase
        .from('reservations')
        .select(selectString, { count: 'exact' })
        .order('start_time', { ascending: false })
        .range(from, to);

    if (statusFilter && statusFilter !== 'ALL') {
        dbQuery = dbQuery.eq('status', statusFilter);
    }

    if (query && query.match(/^[0-9a-f]{8}-[0-9a-f]{4}/)) {
        dbQuery = dbQuery.eq('id', query);
    }

    const { data, count, error } = await dbQuery;

    if (error) {
        console.error('getAdminReservations Fetch Error:', error);

        // Retry with Bare minimum if it failed (likely due to joins)
        if (usingAdminClient) {
            console.log('Retrying with standard client...');
            const { data: retryData, count: retryCount } = await authSession.supabase
                .from('reservations')
                .select('*, reservation_resources(resources(name))', { count: 'exact' })
                .order('start_time', { ascending: false })
                .range(from, to);
            return { data: retryData || [], count: retryCount || 0 };
        }
        return { data: [], count: 0 };
    }

    return { data: data || [], count: count || 0 };
}

export async function getPendingReservations() {
    const authSession = await requireAdmin();
    let supabase = createAdminClient();
    let usingAdminClient = true;

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        supabase = authSession.supabase;
        usingAdminClient = false;
    }

    if (usingAdminClient) {
        await checkAndExpireReservations(supabase);
    }

    const selectString = `
        *,
        reservation_resources(resources(name))
        ${usingAdminClient ? ', profiles(full_name, email)' : ''}
    `;

    const { data, error } = await supabase
        .from('reservations')
        .select(selectString)
        .in('status', ['HOLD', 'PAYMENT_PENDING'])
        .order('start_time', { ascending: true });

    if (error) {
        console.error('getPendingReservations Error:', error);
        // Fallback
        const { data: retryData } = await authSession.supabase
            .from('reservations')
            .select(`*, reservation_resources(resources(name))`)
            .in('status', ['HOLD', 'PAYMENT_PENDING'])
            .order('start_time', { ascending: true });
        return retryData || [];
    }
    return data || [];
}

export async function approveReservation(id: string) {
    await requireAdmin();
    const supabase = createAdminClient();

    // We try admin client, if it fails (no key), we try normal client
    let { error } = await supabase
        .from('reservations')
        .update({ status: 'CONFIRMED' })
        .eq('id', id);

    if (error) {
        console.warn('Admin update failed, trying as user...', error);
        const auth = await requireAdmin();
        const res = await auth.supabase.from('reservations').update({ status: 'CONFIRMED' }).eq('id', id);
        if (res.error) throw new Error(res.error.message);
    }

    revalidatePath('/admin', 'layout');
    return { success: true };
}

export async function rejectReservation(id: string) {
    await requireAdmin();
    const supabase = createAdminClient();

    let { error } = await supabase
        .from('reservations')
        .update({ status: 'CANCELLED' })
        .eq('id', id);

    if (error) {
        const auth = await requireAdmin();
        const res = await auth.supabase.from('reservations').update({ status: 'CANCELLED' }).eq('id', id);
        if (res.error) throw new Error(res.error.message);
    }

    revalidatePath('/admin', 'layout');
    return { success: true };
}
