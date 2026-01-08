-- =============================================================================
-- CONTENT VERIFICATION TOOL - COMPLETE SCHEMA MIGRATION
-- This migration includes all tables, functions, triggers, and policies
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- User roles enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'admin',
        'seo_analyst',
        'content_writer',
        'content_verifier'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Page status enum
DO $$ BEGIN
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
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- USERS TABLE (extends Supabase auth.users)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'content_writer',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- =============================================================================
-- PROJECTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    website_url TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);

-- =============================================================================
-- PROJECT MEMBERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);

-- =============================================================================
-- PAGES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    status page_status NOT NULL DEFAULT 'draft',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_pages_project ON public.pages(project_id);
CREATE INDEX IF NOT EXISTS idx_pages_status ON public.pages(status);

-- Add error_message column if it doesn't exist (for existing databases)
DO $$ BEGIN
    ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS error_message TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- =============================================================================
-- SEO DATA TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.seo_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    primary_keywords TEXT[] NOT NULL DEFAULT '{}',
    secondary_keywords TEXT[] NOT NULL DEFAULT '{}',
    uploaded_by UUID NOT NULL REFERENCES public.users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_seo_data_page ON public.seo_data(page_id);
CREATE INDEX IF NOT EXISTS idx_seo_data_version ON public.seo_data(page_id, version DESC);

-- =============================================================================
-- KEYWORD METRICS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.keyword_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seo_data_id UUID NOT NULL REFERENCES public.seo_data(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    keyword_type TEXT NOT NULL CHECK (keyword_type IN ('primary', 'secondary')),
    search_volume INTEGER,
    cpc DECIMAL(10, 2),
    competition TEXT CHECK (competition IN ('LOW', 'MEDIUM', 'HIGH', NULL)),
    competition_index INTEGER,
    low_top_of_page_bid DECIMAL(10, 2),
    high_top_of_page_bid DECIMAL(10, 2),
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(seo_data_id, keyword)
);

CREATE INDEX IF NOT EXISTS idx_keyword_metrics_seo_data ON public.keyword_metrics(seo_data_id);
CREATE INDEX IF NOT EXISTS idx_keyword_metrics_keyword ON public.keyword_metrics(keyword);

-- =============================================================================
-- CONTENT DATA TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.content_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    google_sheet_url TEXT,
    parsed_content JSONB NOT NULL DEFAULT '{}',
    uploaded_by UUID NOT NULL REFERENCES public.users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_content_data_page ON public.content_data(page_id);
CREATE INDEX IF NOT EXISTS idx_content_data_version ON public.content_data(page_id, version DESC);

-- =============================================================================
-- ANALYSIS RESULTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.analysis_results (
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

CREATE INDEX IF NOT EXISTS idx_analysis_page ON public.analysis_results(page_id);
CREATE INDEX IF NOT EXISTS idx_analysis_processed_at ON public.analysis_results(page_id, processed_at DESC);

-- =============================================================================
-- REVIEW COMMENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.review_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_comments_page ON public.review_comments(page_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_user ON public.review_comments(user_id);

-- =============================================================================
-- AUDIT LOG TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);

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

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pages_updated_at ON public.pages;
CREATE TRIGGER update_pages_updated_at
    BEFORE UPDATE ON public.pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- DISABLE ROW LEVEL SECURITY (Backend handles access control)
-- =============================================================================

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_metrics DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTIONS FOR RLS (kept for backward compatibility, but RLS is disabled)
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
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
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
    
    -- Get role from metadata (passed from signup form)
    role_text := NEW.raw_user_meta_data->>'role';
    
    -- Validate and assign role
    IF role_text IN ('seo_analyst', 'content_writer', 'content_verifier') THEN
        user_role_value := role_text::user_role;
    ELSE
        user_role_value := 'content_writer'::user_role;
    END IF;
    
    INSERT INTO public.users (id, email, name, role)
    VALUES (NEW.id, NEW.email, user_name, user_role_value)
    ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        role = EXCLUDED.role;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- DONE! Complete schema migration finished.
-- =============================================================================

