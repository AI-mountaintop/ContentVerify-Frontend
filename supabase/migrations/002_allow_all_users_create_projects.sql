-- =============================================================================
-- FIX: Allow all authenticated users to create projects
-- Run this ENTIRE script in your Supabase SQL Editor
-- =============================================================================

-- Step 1: Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "projects_insert" ON public.projects;

-- Step 2: Create new policy allowing any authenticated user to create projects
-- This is simpler and doesn't rely on the users table having a profile
CREATE POLICY "projects_insert"
    ON public.projects FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND created_by = auth.uid()
    );

-- Step 3: Update the SELECT policy to be more permissive for authenticated users
DROP POLICY IF EXISTS "projects_select_member" ON public.projects;

CREATE POLICY "projects_select_member"
    ON public.projects FOR SELECT
    USING (
        auth.uid() IS NOT NULL
    );

-- Step 4: Also ensure users can update their own projects
DROP POLICY IF EXISTS "projects_update" ON public.projects;

CREATE POLICY "projects_update"
    ON public.projects FOR UPDATE
    USING (
        created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Step 5: Allow any authenticated user to delete projects
DROP POLICY IF EXISTS "projects_delete" ON public.projects;

CREATE POLICY "projects_delete"
    ON public.projects FOR DELETE
    USING (
        auth.uid() IS NOT NULL
    );
