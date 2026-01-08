-- =============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- This migration adds indexes to optimize query performance
-- =============================================================================

-- =============================================================================
-- FOREIGN KEY INDEXES (for JOIN operations)
-- =============================================================================

-- Projects table
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);

-- Project members table
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_composite ON public.project_members(project_id, user_id);

-- Pages table
CREATE INDEX IF NOT EXISTS idx_pages_project_id ON public.pages(project_id);
CREATE INDEX IF NOT EXISTS idx_pages_status ON public.pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_project_status ON public.pages(project_id, status);

-- SEO data table
CREATE INDEX IF NOT EXISTS idx_seo_data_page_id ON public.seo_data(page_id);
CREATE INDEX IF NOT EXISTS idx_seo_data_page_version ON public.seo_data(page_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_seo_data_uploaded_at ON public.seo_data(uploaded_at DESC);

-- Content data table
CREATE INDEX IF NOT EXISTS idx_content_data_page_id ON public.content_data(page_id);
CREATE INDEX IF NOT EXISTS idx_content_data_page_version ON public.content_data(page_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_content_data_uploaded_at ON public.content_data(uploaded_at DESC);

-- Analysis results table
CREATE INDEX IF NOT EXISTS idx_analysis_results_page_id ON public.analysis_results(page_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_processed_at ON public.analysis_results(page_id, processed_at DESC);

-- Review comments table
CREATE INDEX IF NOT EXISTS idx_review_comments_page_id ON public.review_comments(page_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_user_id ON public.review_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_created_at ON public.review_comments(created_at DESC);

-- Keyword metrics table
CREATE INDEX IF NOT EXISTS idx_keyword_metrics_seo_data_id ON public.keyword_metrics(seo_data_id);
CREATE INDEX IF NOT EXISTS idx_keyword_metrics_keyword ON public.keyword_metrics(keyword);
CREATE INDEX IF NOT EXISTS idx_keyword_metrics_composite ON public.keyword_metrics(seo_data_id, keyword);

-- Audit log table
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON public.audit_log(record_id);

-- Users table
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- =============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- =============================================================================

-- For bulk fetching pages with data (used in getPagesForProjectWithData)
-- These indexes help with the IN clause queries and ordering
CREATE INDEX IF NOT EXISTS idx_seo_data_bulk_lookup ON public.seo_data(page_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_content_data_bulk_lookup ON public.content_data(page_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_results_bulk_lookup ON public.analysis_results(page_id, processed_at DESC);

-- =============================================================================
-- DONE! Performance indexes migration finished.
-- =============================================================================

