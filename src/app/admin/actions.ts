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
    return { user, supabase };
}

// Helper: Check and expire outdated pending reservations
async function checkAndExpireReservations(supabase: any) {
    try {
        const nowIso = new Date().toISOString();

        // 1. Expire HOLDs that passed their TTL
        const { error: holdsError } = await supabase
            .from('reservations')
            .update({ status: 'EXPIRED' }) // Or 'CANCELLED', user checklist mentioned both but 'cancelled' is final. Let's stick to CANCELLED for simplicity unless EXPIRED is preferred. Checklist said "se marca cancelled/expired". CANCELLED is safer for now as per previous code.
            .eq('status', 'HOLD')
            .lt('hold_expires_at', nowIso);

        if (holdsError) console.error('Auto-expire HOLDs warning:', holdsError.message);

        // 2. Expire PAYMENT_PENDING if they passed start_time (Game over)
        const { error: pendingError } = await supabase
            .from('reservations')
            .update({ status: 'CANCELLED' })
            .eq('status', 'PAYMENT_PENDING')
            .lt('start_time', nowIso);

        if (pendingError) console.error('Auto-expire PAYMENT_PENDING warning:', pendingError.message);

    } catch (e) {
        console.error('Auto-expire failed:', e);
    }
}

export async function getAdminStats() {
    try {
        await requireAdmin();

        let supabase = createAdminClient();
        let systemStatus = 'SECURE';

        // Health Check (Check if Service Role works)
        const { error: healthCheck } = await supabase.from('profiles').select('id').limit(1);
        if (healthCheck) {
            console.error('Admin Client Health Check Failed:', healthCheck);
            // Fallback to standard client
            supabase = (await requireAdmin()).supabase;
            systemStatus = 'FALLBACK_AUTH';
        }

        const todayStr = new Date().toISOString().split('T')[0];

        if (systemStatus === 'SECURE') {
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
        // ALWAYS try to fetch profiles. If fallback client fails RLS, so be it, but don't preemptively block it.
        const { data: upcomingToday } = await supabase
            .from('reservations')
            .select(`
                id, start_time, end_time, status, type, total_amount, 
                reservation_resources(resources(name)), 
                profiles(full_name, email)
            `)
            .gte('start_time', new Date().toISOString())
            .lt('start_time', `${todayStr}T23:59:59`)
            .neq('status', 'CANCELLED')
            .order('start_time', { ascending: true })
            .limit(8);

        return {
            todayCount: todayCount || 0,
            pendingCount: pendingCount || 0,
            confirmedWeek: confirmedWeek || 0,
            upcomingToday: upcomingToday || [],
            systemStatus // Returning this to display in UI for debugging
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

    // Health Check
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        usingAdminClient = false;
        supabase = authSession.supabase;
    } else {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) {
            usingAdminClient = false;
            supabase = authSession.supabase;
        }
    }

    if (usingAdminClient) {
        await checkAndExpireReservations(supabase);
    }

    const PAGE_SIZE = 20;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // ALWAYS include profiles in the query string
    const selectString = `
        *,
        reservation_resources(resources(name)),
        profiles(full_name, email)
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

        // Retry logic: If fetch failed (likely RLS on profiles with normal client), try forcing WITHOUT profiles
        // This ensures we at least show the reservations
        if (!usingAdminClient) {
            console.log('Retrying without profiles due to RLS error...');
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
        usingAdminClient = false;
        supabase = authSession.supabase;
    } else {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) {
            usingAdminClient = false;
            supabase = authSession.supabase;
        }
    }

    if (usingAdminClient) {
        await checkAndExpireReservations(supabase);
    }

    // Always ask for profiles initially
    const selectString = `
        *,
        reservation_resources(resources(name)),
        profiles(full_name, email)
    `;

    const { data, error } = await supabase
        .from('reservations')
        .select(selectString)
        .in('status', ['HOLD', 'PAYMENT_PENDING'])
        .order('start_time', { ascending: true });

    if (error) {
        console.error('getPendingReservations Error:', error);
        // Fallback retry without profiles
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
