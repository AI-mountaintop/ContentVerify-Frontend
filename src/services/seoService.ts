import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type SEOData = Database['public']['Tables']['seo_data']['Row'];

export interface SEODataInput {
    page_id: string;
    primary_keywords: string[];
    secondary_keywords: string[];
}

/**
 * Get SEO data for a page
 */
export async function getSEOData(pageId: string): Promise<SEOData | null> {
    const { data, error } = await supabase
        .from('seo_data')
        .select('*')
        .eq('page_id', pageId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // No data found
        console.error('Error fetching SEO data:', error);
        throw error;
    }

    return data;
}

/**
 * Upload/Create SEO data for a page (SEO Analyst only)
 */
export async function uploadSEOData(input: SEODataInput): Promise<SEOData> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    // Check if SEO data already exists for this page
    const existing = await getSEOData(input.page_id);
    const newVersion = existing ? existing.version + 1 : 1;

    const { data, error } = await supabase
        .from('seo_data')
        .insert({
            page_id: input.page_id,
            primary_keywords: input.primary_keywords,
            secondary_keywords: input.secondary_keywords,
            uploaded_by: userData.user.id,
            version: newVersion,
        })
        .select()
        .single();

    if (error) {
        console.error('Error uploading SEO data:', error);
        throw error;
    }

    // Update page status to awaiting_content if it was in draft
    await supabase
        .from('pages')
        .update({ status: 'awaiting_content' })
        .eq('id', input.page_id)
        .eq('status', 'draft');

    // Fetch keyword metrics from DataForSEO in the background (non-blocking)
    fetchAndStoreKeywordMetrics(
        data.id,
        input.primary_keywords,
        input.secondary_keywords
    ).catch(err => console.error('Error fetching keyword metrics:', err));

    return data;
}

/**
 * Fetch keyword metrics from DataForSEO and store in database
 */
async function fetchAndStoreKeywordMetrics(
    seoDataId: string,
    primaryKeywords: string[],
    secondaryKeywords: string[]
): Promise<void> {
    // Dynamic import to avoid circular dependencies
    const { fetchKeywordMetrics } = await import('./dataForSEOService');

    const allKeywords = [...primaryKeywords, ...secondaryKeywords];
    if (allKeywords.length === 0) return;

    // Fetch metrics from DataForSEO
    const metrics = await fetchKeywordMetrics(allKeywords);

    // Prepare data for insertion
    const metricsToInsert = metrics.map(metric => ({
        seo_data_id: seoDataId,
        keyword: metric.keyword,
        keyword_type: primaryKeywords.includes(metric.keyword) ? 'primary' : 'secondary',
        search_volume: metric.search_volume,
        cpc: metric.cpc,
        competition: metric.competition,
        competition_index: metric.competition_index,
        low_top_of_page_bid: metric.low_top_of_page_bid,
        high_top_of_page_bid: metric.high_top_of_page_bid,
    }));

    // Insert metrics into database
    const { error } = await supabase
        .from('keyword_metrics')
        .upsert(metricsToInsert, {
            onConflict: 'seo_data_id,keyword',
        });

    if (error) {
        console.error('Error storing keyword metrics:', error);
    } else {
        console.log(`Stored metrics for ${metricsToInsert.length} keywords`);
    }
}

/**
 * Get keyword metrics for a specific seo_data entry
 */
export async function getKeywordMetrics(seoDataId: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('keyword_metrics')
        .select('*')
        .eq('seo_data_id', seoDataId);

    if (error) {
        console.error('Error fetching keyword metrics:', error);
        return [];
    }

    return data || [];
}

/**
 * Update existing SEO data
 */
export async function updateSEOData(
    seoDataId: string,
    updates: Partial<Pick<SEODataInput, 'primary_keywords' | 'secondary_keywords'>>
): Promise<SEOData> {
    const { data, error } = await supabase
        .from('seo_data')
        .update(updates)
        .eq('id', seoDataId)
        .select()
        .single();

    if (error) {
        console.error('Error updating SEO data:', error);
        throw error;
    }

    return data;
}

/**
 * Get all SEO data versions for a page
 */
export async function getSEODataHistory(pageId: string): Promise<SEOData[]> {
    const { data, error } = await supabase
        .from('seo_data')
        .select('*')
        .eq('page_id', pageId)
        .order('version', { ascending: false });

    if (error) {
        console.error('Error fetching SEO data history:', error);
        throw error;
    }

    return data || [];
}
