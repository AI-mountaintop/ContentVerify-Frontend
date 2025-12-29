-- =============================================================================
-- Add keyword metrics table for DataForSEO data
-- Run this in your Supabase SQL Editor
-- =============================================================================

-- Create keyword_metrics table to store DataForSEO data
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

CREATE INDEX idx_keyword_metrics_seo_data ON public.keyword_metrics(seo_data_id);
CREATE INDEX idx_keyword_metrics_keyword ON public.keyword_metrics(keyword);

-- Enable RLS
ALTER TABLE public.keyword_metrics ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to view keyword metrics
CREATE POLICY "keyword_metrics_select"
    ON public.keyword_metrics FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert keyword metrics
CREATE POLICY "keyword_metrics_insert"
    ON public.keyword_metrics FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update keyword metrics
CREATE POLICY "keyword_metrics_update"
    ON public.keyword_metrics FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete keyword metrics
CREATE POLICY "keyword_metrics_delete"
    ON public.keyword_metrics FOR DELETE
    USING (auth.uid() IS NOT NULL);
