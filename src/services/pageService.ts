import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Page = Database['public']['Tables']['pages']['Row'];
type PageInsert = Database['public']['Tables']['pages']['Insert'];
type PageUpdate = Database['public']['Tables']['pages']['Update'];
type PageStatus = Database['public']['Enums']['page_status'];

export interface PageWithData extends Page {
    seo_data?: SEODataBasic | null;
    content_data?: ContentDataBasic | null;
    analysis_results?: AnalysisBasic | null;
}

interface SEODataBasic {
    id: string;
    primary_keywords: string[];
    secondary_keywords: string[];
    uploaded_by: string;
    uploaded_at: string;
    version: number;
}

interface ContentDataBasic {
    id: string;
    google_sheet_url: string | null;
    uploaded_by: string;
    uploaded_at: string;
    version: number;
}

interface AnalysisBasic {
    id: string;
    overall_score: number;
    processed_at: string;
}

/**
 * Get all pages for a project
 */
export async function getPages(projectId: string): Promise<PageWithData[]> {
    const { data, error } = await supabase
        .from('pages')
        .select(`
            *,
            seo_data (id, primary_keywords, secondary_keywords, uploaded_by, uploaded_at, version),
            content_data (id, google_sheet_url, uploaded_by, uploaded_at, version),
            analysis_results (id, overall_score, processed_at)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching pages:', error);
        throw error;
    }

    return (data || []).map(page => ({
        ...page,
        seo_data: page.seo_data?.[0] || null,
        content_data: page.content_data?.[0] || null,
        analysis_results: page.analysis_results?.[0] || null,
    }));
}

/**
 * Get a single page by ID with all related data
 */
export async function getPageById(pageId: string): Promise<PageWithData | null> {
    const { data, error } = await supabase
        .from('pages')
        .select(`
            *,
            seo_data (*),
            content_data (*),
            analysis_results (*),
            review_comments (*)
        `)
        .eq('id', pageId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching page:', error);
        throw error;
    }

    return {
        ...data,
        seo_data: data?.seo_data?.[0] || null,
        content_data: data?.content_data?.[0] || null,
        analysis_results: data?.analysis_results?.[0] || null,
    };
}

/**
 * Create a new page in a project
 */
export async function createPage(page: {
    project_id: string;
    name: string;
    slug: string;
}): Promise<Page> {
    const { data, error } = await supabase
        .from('pages')
        .insert({
            project_id: page.project_id,
            name: page.name,
            slug: page.slug,
            status: 'draft',
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating page:', error);
        throw error;
    }

    return data;
}

/**
 * Update a page
 */
export async function updatePage(
    pageId: string,
    updates: PageUpdate
): Promise<Page> {
    const { data, error } = await supabase
        .from('pages')
        .update(updates)
        .eq('id', pageId)
        .select()
        .single();

    if (error) {
        console.error('Error updating page:', error);
        throw error;
    }

    return data;
}

/**
 * Update page status
 */
export async function updatePageStatus(
    pageId: string,
    status: PageStatus
): Promise<Page> {
    return updatePage(pageId, { status });
}

/**
 * Delete a page
 */
export async function deletePage(pageId: string): Promise<void> {
    const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', pageId);

    if (error) {
        console.error('Error deleting page:', error);
        throw error;
    }
}
