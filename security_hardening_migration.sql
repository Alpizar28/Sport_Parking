-- SECURITY HARDENING MIGRATION
-- This migration fixes critical RLS policy vulnerabilities

BEGIN;

-- ============================================================================
-- 1. FIX OVERLY PERMISSIVE INSERT POLICIES
-- ============================================================================

-- DROP insecure policies
DROP POLICY IF EXISTS "Public insert reservations" ON public.reservations;
DROP POLICY IF EXISTS "Public insert reservation_resources" ON public.reservation_resources;

-- CREATE secure policies that validate user ownership
CREATE POLICY "Users can insert own reservations"
ON public.reservations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert reservation_resources"
ON public.reservation_resources
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM reservations
        WHERE reservations.id = reservation_resources.reservation_id
        AND reservations.user_id = auth.uid()
    )
);

-- ============================================================================
-- 2. FIX DUPLICATE/REDUNDANT POLICIES
-- ============================================================================

-- Remove duplicate reservation read policies
DROP POLICY IF EXISTS "Users view own reservations" ON public.reservations;
-- Keep only "Users read own reservations" which is more specific

-- ============================================================================
-- 3. STRENGTHEN ADMIN POLICIES
-- ============================================================================

-- Ensure admin policies use consistent is_admin() function
DROP POLICY IF EXISTS "Admin view all reservation_resources" ON public.reservation_resources;

CREATE POLICY "Admin full access reservation_resources"
ON public.reservation_resources
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================================================
-- 4. ADD MISSING UPDATE/DELETE POLICIES
-- ============================================================================

-- Allow users to update their own reservations (for cancellation)
CREATE POLICY "Users can update own reservations"
ON public.reservations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can update any reservation
CREATE POLICY "Admins can update all reservations"
ON public.reservations
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Admins can delete reservations
CREATE POLICY "Admins can delete reservations"
ON public.reservations
FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================================================
-- 5. SECURE PAYMENTS TABLE
-- ============================================================================

-- Add insert policy for payments (only system/admin should create)
CREATE POLICY "Admin can insert payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Add update policy for payments
CREATE POLICY "Admin can update payments"
ON public.payments
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================================================
-- 6. FIX FUNCTION SECURITY (search_path)
-- ============================================================================

-- Recreate is_admin function with secure search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'ADMIN'
    );
END;
$$;

-- Recreate handle_new_user with secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        'USER'
    );
    RETURN new;
END;
$$;

-- ============================================================================
-- 7. ADD RATE LIMITING PROTECTION
-- ============================================================================

-- Create a function to check reservation rate limiting
CREATE OR REPLACE FUNCTION check_reservation_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    recent_count INTEGER;
BEGIN
    -- Check if user has created more than 5 reservations in the last hour
    SELECT COUNT(*) INTO recent_count
    FROM reservations
    WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '1 hour';
    
    IF recent_count >= 10 THEN
        RAISE EXCEPTION 'Rate limit exceeded. Maximum 10 reservations per hour.';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Add trigger for rate limiting
DROP TRIGGER IF EXISTS enforce_reservation_rate_limit ON reservations;
CREATE TRIGGER enforce_reservation_rate_limit
    BEFORE INSERT ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION check_reservation_rate_limit();

-- ============================================================================
-- 8. PREVENT HOLD MANIPULATION
-- ============================================================================

-- Create trigger to prevent users from extending their own holds
CREATE OR REPLACE FUNCTION prevent_hold_extension()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Only admins can extend hold_expires_at
    IF OLD.hold_expires_at IS DISTINCT FROM NEW.hold_expires_at THEN
        IF NOT is_admin() THEN
            RAISE EXCEPTION 'Only admins can modify hold expiration times';
        END IF;
    END IF;
    
    -- Users cannot change status from HOLD to CONFIRMED directly
    IF OLD.status IN ('HOLD', 'PAYMENT_PENDING') AND NEW.status = 'CONFIRMED' THEN
        IF NOT is_admin() THEN
            RAISE EXCEPTION 'Only admins can confirm reservations';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_hold_integrity ON reservations;
CREATE TRIGGER enforce_hold_integrity
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION prevent_hold_extension();

-- ============================================================================
-- 9. AUDIT LOGGING
-- ============================================================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins read audit logs"
ON public.audit_log
FOR SELECT
TO authenticated
USING (is_admin());

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_reservations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, operation, user_id, old_data, new_data)
        VALUES (
            TG_TABLE_NAME,
            TG_OP,
            auth.uid(),
            row_to_json(OLD),
            row_to_json(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, operation, user_id, old_data)
        VALUES (
            TG_TABLE_NAME,
            TG_OP,
            auth.uid(),
            row_to_json(OLD)
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Add audit triggers
DROP TRIGGER IF EXISTS audit_reservations_trigger ON reservations;
CREATE TRIGGER audit_reservations_trigger
    AFTER UPDATE OR DELETE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION audit_reservations();

COMMIT;
