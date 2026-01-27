'use server';

import { createClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// Helper: Ensure Admin
async function requireAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Secure Check using the "is_admin" function if available, or direct query
    // Since we fixed the recursion, we can query profiles.
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'ADMIN') throw new Error('Forbidden: Admin Access Required');
    return supabase;
}

// Helper: Check and expire outdated pending reservations
async function checkAndExpireReservations(supabase: any) {
    const nowIso = new Date().toISOString();

    // Find reservations that are:
    // 1. Status is HOLD or PAYMENT_PENDING
    // 2. Start time has passed
    // We update them to CANCELLED (or EXPIRED, but user asked for cancelled logic)

    const { error } = await supabase
        .from('reservations')
        .update({ status: 'CANCELLED' })
        .in('status', ['HOLD', 'PAYMENT_PENDING'])
        .lt('start_time', nowIso);

    if (error) {
        console.error('Error auto-expiring reservations:', error);
    }
}

export async function getAdminStats() {
    try {
        const supabase = await requireAdmin();
        const todayStr = new Date().toISOString().split('T')[0];

        // Auto-expire check
        await checkAndExpireReservations(supabase);

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
            .in('status', ['HOLD', 'PAYMENT_PENDING']); // Assuming these are 'pending'

        // 3. Confirmed Last 7 Days
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const { count: confirmedWeek } = await supabase
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .gte('start_time', lastWeek.toISOString())
            .eq('status', 'CONFIRMED');

        // 4. Upcomings for today (list)
        const { data: upcomingToday } = await supabase
            .from('reservations')
            .select(`
                id, start_time, end_time, status, type, total_amount,
                reservation_resources(resources(name)),
                profiles(full_name, email)
            `)
            .gte('start_time', new Date().toISOString()) // From now onwards
            .lt('start_time', `${todayStr}T23:59:59`)
            .neq('status', 'CANCELLED')
            .order('start_time', { ascending: true })
            .limit(8);

        return {
            todayCount: todayCount || 0,
            pendingCount: pendingCount || 0,
            confirmedWeek: confirmedWeek || 0,
            upcomingToday: upcomingToday || []
        };
    } catch (e) {
        console.error('getAdminStats error:', e);
        return null;
    }
}

export async function getAdminReservations(statusFilter?: string, query?: string, page = 1) {
    const supabase = await requireAdmin();

    // Auto-expire check
    await checkAndExpireReservations(supabase);

    const PAGE_SIZE = 20;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let dbQuery = supabase
        .from('reservations')
        .select(`
            *,
            reservation_resources(resources(name)),
            profiles(full_name, email)
        `, { count: 'exact' })
        .order('start_time', { ascending: false })
        .range(from, to);

    if (statusFilter && statusFilter !== 'ALL') {
        dbQuery = dbQuery.eq('status', statusFilter);
    }

    // Search is tricky with RLS/joins. 
    // If 'profiles.email' search is needed, we usually need an inner join or a different structure.
    // For MVP, if query is provided, we might try to filter by ID if it's a UUID, otherwise it's hard on 'profiles.email' without direct access or flattened view.
    // We'll skip complex search for now or just search ID.
    if (query) {
        // Simple text search on reservation fields if applicable, or exact match ID
        if (query.match(/^[0-9a-f]{8}-[0-9a-f]{4}/)) {
            dbQuery = dbQuery.eq('id', query);
        }
    }

    const { data, count, error } = await dbQuery;

    // Fallback if join fails (likely recursion/RLS on profiles)
    if (error) {
        console.error('getAdminReservations Error:', JSON.stringify(error, null, 2));

        // Attempt safe fetch WITHOUT profiles join to at least show reservation data
        const { data: safeData, count: safeCount } = await supabase
            .from('reservations')
            .select('*', { count: 'exact' })
            .order('start_time', { ascending: false })
            .range(from, to);

        return { data: safeData, count: safeCount };
    }

    return { data, count };
}

export async function getPendingReservations() {
    const supabase = await requireAdmin();

    // Auto-expire check
    await checkAndExpireReservations(supabase);

    // Pending usually means HOLD (waiting payment proof) or PAYMENT_PENDING
    const { data, error } = await supabase
        .from('reservations')
        .select(`
            *,
            reservation_resources(resources(name)),
            profiles(full_name, email)
        `)
        .in('status', ['HOLD', 'PAYMENT_PENDING'])
        .order('start_time', { ascending: true });

    if (error) console.error('getPendingReservations error', error);
    return data || [];
}

export async function approveReservation(id: string) {
    const supabase = await requireAdmin();
    // Assuming 'CONFIRMED' is the target status
    const { error } = await supabase
        .from('reservations')
        .update({ status: 'CONFIRMED' })
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/admin');
    revalidatePath('/admin/reservations');
    revalidatePath('/admin/pending');
    return { success: true };
}

export async function rejectReservation(id: string) {
    const supabase = await requireAdmin();
    const { error } = await supabase
        .from('reservations')
        .update({ status: 'CANCELLED' })
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/admin');
    revalidatePath('/admin/reservations');
    revalidatePath('/admin/pending');
    return { success: true };
}
