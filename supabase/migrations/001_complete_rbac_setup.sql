-- =============================================================================
-- CONTENT VERIFICATION TOOL - COMPLETE SUPABASE MIGRATION
-- Run this in your Supabase SQL Editor (SQL Editor > New query)
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- User roles enum
CREATE TYPE user_role AS ENUM (
    'admin',
    'seo_analyst',
    'content_writer',
    'content_verifier'
);

-- Page status enum
CREATE TYPE page_status AS ENUM (
    'draft',
    'awaiting_seo',
    'awaiting_content',
    'processing',
    'pending_review',
    'revision_requested',
    'approved',
    'rejected'
);

-- =============================================================================
-- USERS TABLE (extends Supabase auth.users)
-- =============================================================================

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'content_writer',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON public.users(role);

-- =============================================================================
-- PROJECTS TABLE
-- =============================================================================

CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    website_url TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_created_by ON public.projects(created_by);

-- =============================================================================
-- PROJECT MEMBERS TABLE
-- =============================================================================

CREATE TABLE public.project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_members_project ON public.project_members(project_id);
CREATE INDEX idx_project_members_user ON public.project_members(user_id);

-- =============================================================================
-- PAGES TABLE
-- =============================================================================

CREATE TABLE public.pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    status page_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, slug)
);

CREATE INDEX idx_pages_project ON public.pages(project_id);
CREATE INDEX idx_pages_status ON public.pages(status);

-- =============================================================================
-- SEO DATA TABLE
-- =============================================================================

CREATE TABLE public.seo_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    primary_keywords TEXT[] NOT NULL DEFAULT '{}',
    secondary_keywords TEXT[] NOT NULL DEFAULT '{}',
    uploaded_by UUID NOT NULL REFERENCES public.users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_seo_data_page ON public.seo_data(page_id);

-- =============================================================================
-- CONTENT DATA TABLE
-- =============================================================================

CREATE TABLE public.content_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    google_sheet_url TEXT,
    parsed_content JSONB NOT NULL DEFAULT '{}',
    uploaded_by UUID NOT NULL REFERENCES public.users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_content_data_page ON public.content_data(page_id);

-- =============================================================================
-- ANALYSIS RESULTS TABLE
-- =============================================================================

CREATE TABLE public.analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    seo_score INTEGER NOT NULL CHECK (seo_score >= 0 AND seo_score <= 100),
    readability_score INTEGER NOT NULL CHECK (readability_score >= 0 AND readability_score <= 100),
    keyword_density_score INTEGER NOT NULL CHECK (keyword_density_score >= 0 AND keyword_density_score <= 100),
    grammar_score INTEGER NOT NULL CHECK (grammar_score >= 0 AND grammar_score <= 100),
    content_intent_score INTEGER NOT NULL CHECK (content_intent_score >= 0 AND content_intent_score <= 100),
    technical_health_score INTEGER NOT NULL CHECK (technical_health_score >= 0 AND technical_health_score <= 100),
    keyword_analysis JSONB NOT NULL DEFAULT '[]',
    suggestions JSONB NOT NULL DEFAULT '[]',
    highlighted_content TEXT,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analysis_page ON public.analysis_results(page_id);

-- =============================================================================
-- REVIEW COMMENTS TABLE
-- =============================================================================

CREATE TABLE public.review_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_review_comments_page ON public.review_comments(page_id);

-- =============================================================================
-- AUDIT LOG TABLE
-- =============================================================================

CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_table ON public.audit_log(table_name);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at DESC);

-- =============================================================================
-- TRIGGERS FOR updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at
    BEFORE UPDATE ON public.pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTIONS FOR RLS
-- =============================================================================

-- Get the current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role FROM public.users WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is a member of a project
CREATE OR REPLACE FUNCTION public.is_project_member(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_id = project_uuid AND user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = project_uuid AND created_by = auth.uid()
    ) OR public.is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() = required_role OR public.is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- USERS TABLE POLICIES
-- =============================================================================

-- Users can view their own profile
CREATE POLICY "users_select_own"
    ON public.users FOR SELECT
    USING (id = auth.uid());

-- Admins can view all users
CREATE POLICY "users_select_admin"
    ON public.users FOR SELECT
    USING (public.is_admin());

-- Users can update their own profile (except role)
CREATE POLICY "users_update_own"
    ON public.users FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.users WHERE id = auth.uid()));

-- Admins can update any user including role
CREATE POLICY "users_update_admin"
    ON public.users FOR UPDATE
    USING (public.is_admin());

-- Only admins can delete users
CREATE POLICY "users_delete_admin"
    ON public.users FOR DELETE
    USING (public.is_admin());

-- =============================================================================
-- PROJECTS TABLE POLICIES
-- =============================================================================

-- Users can view projects they are members of or created
CREATE POLICY "projects_select_member"
    ON public.projects FOR SELECT
    USING (
        created_by = auth.uid() OR
        public.is_project_member(id) OR
        public.is_admin() OR
        public.get_user_role() = 'seo_analyst'
    );

-- SEO analysts and admins can create projects
CREATE POLICY "projects_insert"
    ON public.projects FOR INSERT
    WITH CHECK (
        public.has_role('seo_analyst') OR public.is_admin()
    );

-- Project creator and admins can update
CREATE POLICY "projects_update"
    ON public.projects FOR UPDATE
    USING (created_by = auth.uid() OR public.is_admin());

-- Only admins can delete projects
CREATE POLICY "projects_delete"
    ON public.projects FOR DELETE
    USING (public.is_admin());

-- =============================================================================
-- PROJECT MEMBERS POLICIES
-- =============================================================================

-- Members can view other members of their projects
CREATE POLICY "project_members_select"
    ON public.project_members FOR SELECT
    USING (public.is_project_member(project_id));

-- Project creator and admins can add members
CREATE POLICY "project_members_insert"
    ON public.project_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE id = project_id AND created_by = auth.uid()
        ) OR public.is_admin()
    );

-- Project creator and admins can update member roles
CREATE POLICY "project_members_update"
    ON public.project_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE id = project_id AND created_by = auth.uid()
        ) OR public.is_admin()
    );

-- Project creator and admins can remove members
CREATE POLICY "project_members_delete"
    ON public.project_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE id = project_id AND created_by = auth.uid()
        ) OR public.is_admin()
    );

-- =============================================================================
-- PAGES POLICIES
-- =============================================================================

-- Project members can view pages
CREATE POLICY "pages_select"
    ON public.pages FOR SELECT
    USING (public.is_project_member(project_id));

-- SEO analysts and admins can create pages
CREATE POLICY "pages_insert"
    ON public.pages FOR INSERT
    WITH CHECK (
        public.is_project_member(project_id) AND
        (public.has_role('seo_analyst') OR public.is_admin())
    );

-- SEO analysts and admins can update pages
CREATE POLICY "pages_update"
    ON public.pages FOR UPDATE
    USING (
        public.is_project_member(project_id) AND
        (public.has_role('seo_analyst') OR public.is_admin())
    );

-- Only admins can delete pages
CREATE POLICY "pages_delete"
    ON public.pages FOR DELETE
    USING (public.is_admin());

-- =============================================================================
-- SEO DATA POLICIES
-- =============================================================================

-- Project members can view SEO data
CREATE POLICY "seo_data_select"
    ON public.seo_data FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.pages p
            WHERE p.id = page_id AND public.is_project_member(p.project_id)
        )
    );

-- SEO analysts and admins can insert SEO data
CREATE POLICY "seo_data_insert"
    ON public.seo_data FOR INSERT
    WITH CHECK (
        (public.has_role('seo_analyst') OR public.is_admin()) AND
        EXISTS (
            SELECT 1 FROM public.pages p
            WHERE p.id = page_id AND public.is_project_member(p.project_id)
        )
    );

-- SEO analysts and admins can update SEO data
CREATE POLICY "seo_data_update"
    ON public.seo_data FOR UPDATE
    USING (
        (public.has_role('seo_analyst') OR public.is_admin()) AND
        EXISTS (
            SELECT 1 FROM public.pages p
            WHERE p.id = page_id AND public.is_project_member(p.project_id)
        )
    );

-- =============================================================================
-- CONTENT DATA POLICIES
-- =============================================================================

-- Project members can view content
CREATE POLICY "content_data_select"
    ON public.content_data FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.pages p
            WHERE p.id = page_id AND public.is_project_member(p.project_id)
        )
    );

-- Content writers and admins can insert content
CREATE POLICY "content_data_insert"
    ON public.content_data FOR INSERT
    WITH CHECK (
        (public.has_role('content_writer') OR public.is_admin()) AND
        EXISTS (
            SELECT 1 FROM public.pages p
            WHERE p.id = page_id AND public.is_project_member(p.project_id)
        )
    );

-- Content writers and admins can update content
CREATE POLICY "content_data_update"
    ON public.content_data FOR UPDATE
    USING (
        (public.has_role('content_writer') OR public.is_admin()) AND
        EXISTS (
            SELECT 1 FROM public.pages p
            WHERE p.id = page_id AND public.is_project_member(p.project_id)
        )
    );

-- =============================================================================
-- ANALYSIS RESULTS POLICIES
-- =============================================================================

-- Project members can view analysis
CREATE POLICY "analysis_results_select"
    ON public.analysis_results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.pages p
            WHERE p.id = page_id AND public.is_project_member(p.project_id)
        )
    );

-- Only admin can insert analysis (typically done via service role)
CREATE POLICY "analysis_results_insert"
    ON public.analysis_results FOR INSERT
    WITH CHECK (public.is_admin());

-- =============================================================================
-- REVIEW COMMENTS POLICIES
-- =============================================================================

-- Project members can view comments
CREATE POLICY "review_comments_select"
    ON public.review_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.pages p
            WHERE p.id = page_id AND public.is_project_member(p.project_id)
        )
    );

-- Content verifiers and admins can add comments
CREATE POLICY "review_comments_insert"
    ON public.review_comments FOR INSERT
    WITH CHECK (
        (public.has_role('content_verifier') OR public.is_admin()) AND
        EXISTS (
            SELECT 1 FROM public.pages p
            WHERE p.id = page_id AND public.is_project_member(p.project_id)
        )
    );

-- =============================================================================
-- AUDIT LOG POLICIES
-- =============================================================================

-- Only admins can view audit log
CREATE POLICY "audit_log_select"
    ON public.audit_log FOR SELECT
    USING (public.is_admin());

-- System inserts audit logs (use service role)
CREATE POLICY "audit_log_insert"
    ON public.audit_log FOR INSERT
    WITH CHECK (TRUE);

-- =============================================================================
-- PAGE STATUS UPDATE FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_page_status(
    page_uuid UUID,
    new_status page_status
)
RETURNS BOOLEAN AS $$
DECLARE
    user_current_role user_role;
    page_current_status page_status;
BEGIN
    user_current_role := public.get_user_role();
    SELECT status INTO page_current_status FROM public.pages WHERE id = page_uuid;
    
    -- Admin can change to any status
    IF user_current_role = 'admin' THEN
        UPDATE public.pages SET status = new_status WHERE id = page_uuid;
        RETURN TRUE;
    END IF;
    
    -- Content verifier can approve, reject, or request revision
    IF user_current_role = 'content_verifier' THEN
        IF new_status IN ('approved', 'rejected', 'revision_requested') AND
           page_current_status = 'pending_review' THEN
            UPDATE public.pages SET status = new_status WHERE id = page_uuid;
            RETURN TRUE;
        END IF;
    END IF;
    
    -- Content writer can submit for review
    IF user_current_role = 'content_writer' THEN
        IF new_status = 'pending_review' AND
           page_current_status IN ('awaiting_content', 'revision_requested') THEN
            UPDATE public.pages SET status = new_status WHERE id = page_uuid;
            RETURN TRUE;
        END IF;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- AUTH TRIGGER: Auto-create user profile on signup
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    user_role_value user_role;
    role_text TEXT;
BEGIN
    -- Get name from metadata or derive from email
    user_name := COALESCE(  
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    
    -- Get role from metadata, default to 'content_writer'
    role_text := NEW.raw_user_meta_data->>'role';
    
    IF role_text IS NOT NULL AND role_text IN ('admin', 'seo_analyst', 'content_writer', 'content_verifier') THEN
        user_role_value := role_text::user_role;
    ELSE
        user_role_value := 'content_writer'::user_role;
    END IF;
    
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        user_name,
        user_role_value
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail auth
        RAISE WARNING 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- DONE! Your database is now set up with RBAC.
-- =============================================================================
