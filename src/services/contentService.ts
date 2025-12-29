import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type ContentData = Database['public']['Tables']['content_data']['Row'];

export interface ParsedContent {
    meta_title?: string;
    meta_description?: string;
    h1: string[];
    h2: string[];
    h3: string[];
    paragraphs: string[];
    alt_texts?: string[];
}

export interface ContentDataInput {
    page_id: string;
    parsed_content: ParsedContent;
    google_sheet_url?: string;
}

/**
 * Get content data for a page
 */
export async function getContentData(pageId: string): Promise<ContentData | null> {
    const { data, error } = await supabase
        .from('content_data')
        .select('*')
        .eq('page_id', pageId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // No data found
        console.error('Error fetching content data:', error);
        throw error;
    }

    return data;
}

/**
 * Upload/Create content data for a page (Content Writer only)
 */
export async function uploadContentData(input: ContentDataInput): Promise<ContentData> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    // Check if content data already exists for this page
    const existing = await getContentData(input.page_id);
    const newVersion = existing ? existing.version + 1 : 1;

    const { data, error } = await supabase
        .from('content_data')
        .insert({
            page_id: input.page_id,
            parsed_content: input.parsed_content as any,
            google_sheet_url: input.google_sheet_url || null,
            uploaded_by: userData.user.id,
            version: newVersion,
        })
        .select()
        .single();

    if (error) {
        console.error('Error uploading content data:', error);
        throw error;
    }

    // Update page status to awaiting_seo if it was in draft, or to processing if SEO is done
    const { data: pageData } = await supabase
        .from('pages')
        .select('status')
        .eq('id', input.page_id)
        .single();

    if (pageData) {
        // Check if SEO data exists
        const { data: seoData } = await supabase
            .from('seo_data')
            .select('id')
            .eq('page_id', input.page_id)
            .limit(1);

        if (seoData && seoData.length > 0) {
            // Both SEO and content are now present - set to pending_review
            await supabase
                .from('pages')
                .update({ status: 'pending_review' })
                .eq('id', input.page_id);
        } else if (pageData.status === 'draft') {
            // Only content is present - awaiting SEO
            await supabase
                .from('pages')
                .update({ status: 'awaiting_seo' })
                .eq('id', input.page_id);
        }
    }

    return data;
}

/**
 * Update existing content data
 */
export async function updateContentData(
    contentDataId: string,
    updates: Partial<Pick<ContentDataInput, 'parsed_content' | 'google_sheet_url'>>
): Promise<ContentData> {
    const { data, error } = await supabase
        .from('content_data')
        .update(updates as any)
        .eq('id', contentDataId)
        .select()
        .single();

    if (error) {
        console.error('Error updating content data:', error);
        throw error;
    }

    return data;
}
