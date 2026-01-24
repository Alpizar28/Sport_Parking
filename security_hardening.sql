-- SECURITY HARDENING SCRIPT
-- Execute this in Supabase SQL Editor to update existing policies.

-- 1. Reservations: Clients cannot INSERT directly.
DROP POLICY IF EXISTS "Users create reservations" ON public.reservations;
-- (Clients can still SELECT own, defined by "Users read own reservations")

-- 2. Payments: Admin cannot WRITE directly (only Read).
-- Drop old policy
DROP POLICY IF EXISTS "Admin all payments" ON public.payments;

-- Create new policy: Admin SELECT only
CREATE POLICY "Admin read payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 3. Reservation Resources: Ensure no direct write by clients (Admin can still write via Service Role bypass, but let's restrict User Context)
-- Check current policies... usually we didn't have explicit "Users create..." for resources?
-- Original schema had:
-- CREATE POLICY "Read linked resources" ...
-- It didn't have an INSERT policy for users?
-- If no INSERT policy exists for 'authenticated', then they implicitly CANNOT insert (RLS default deny).
-- So just double check we don't have permissive policies.

-- Ensure Admin User cannot write Payments directly implies they rely on Backend Service Role.
-- Backend endpoints use service_role key, which BYPASSES RLS.
-- So these policies strictly control what the Browser/Client-side code can do.

-- 4. Verification of Reservations Updates
-- Clients might need to UPDATE status? No, status update is backend only.
-- Clients might need to UPDATE customer_note? Maybe.
-- For now, MVP says "Toda creación/actualización crítica debe pasar por backend".
-- So we ensure NO UPDATE policy for Clients exists on reservations.
-- Original schema checked:
-- "Users read own reservations" -> SELECT only.
-- "Users create reservations" -> INSERT. (We just dropped this).
-- So Clients are now Read-Only on reservations table. Correct.

-- 5. Harden Resources (just in case)
-- "Admin write resources" -> ALL (includes INSERT/UPDATE). This allows Admin User Context to edit resources (e.g. change capacity).
-- This seems acceptable for Admin Panel if we build one, but user said "Admin no debe poder UPDATE/INSERT payments".
-- Didn't say Resources. Resources usually managed by Admin. We keep it as is or restrict if desired.
-- User only mentioned "Pagos" and "Reservations".

-- Summary:
-- Dropped "Users create reservations".
-- Replaced "Admin all payments" with "Admin read payments".
