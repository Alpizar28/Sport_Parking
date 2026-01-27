-- FIX INFINITE RECURSION IN RLS POLICIES
-- The current "Admins read all profiles" policy triggers infinite recursion because it queries 'profiles' within the 'profiles' policy.
-- Solution: Use a SECURITY DEFINER function to check admin status without triggering RLS.

-- 1. Create a secure function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- This SELECT bypasses RLS because the function is SECURITY DEFINER
  -- ensuring we don't trigger the "Admins read all profiles" policy recursively.
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the problematic policies on PROFILES
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;

-- 3. Re-create the Profiles policy using the function
CREATE POLICY "Admins read all profiles" ON public.profiles
FOR SELECT USING (
  is_admin()
);

-- 4. Update Reservations policy to be safe as well (although optional if profiles is fixed, this is cleaner)
DROP POLICY IF EXISTS "Admin all reservations" ON public.reservations;

CREATE POLICY "Admin all reservations" ON public.reservations
FOR ALL USING (
  is_admin()
);

-- 5. Update Payments policy
DROP POLICY IF EXISTS "Admin read payments" ON public.payments;

CREATE POLICY "Admin read payments" ON public.payments
FOR SELECT USING (
  is_admin()
);

-- 6. Update Resources policy (if it exists)
DROP POLICY IF EXISTS "Admin write resources" ON public.resources;

CREATE POLICY "Admin write resources" ON public.resources
FOR ALL USING (
  is_admin()
);
