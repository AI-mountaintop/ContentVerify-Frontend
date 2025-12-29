import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export interface ProjectWithDetails extends Project {
    pages?: PageBasic[];
    members?: MemberBasic[];
}

interface PageBasic {
    id: string;
    name: string;
    slug: string;
    status: string;
    created_at?: string;
    updated_at?: string;
    seo_data?: {
        id: string;
        primary_keywords: string[];
        secondary_keywords: string[];
        uploaded_by: string;
        uploaded_at: string;
        version: number;
    }[];
    content_data?: {
        id: string;
        parsed_content: any;
        google_sheet_url: string | null;
        uploaded_by: string;
        uploaded_at: string;
        version: number;
    }[];
    analysis_results?: {
        id: string;
        overall_score: number;
        seo_score: number;
        readability_score: number;
        keyword_density_score: number;
        grammar_score: number;
        content_intent_score: number;
        technical_health_score: number;
        detailed_feedback: any;
    }[];
}

interface MemberBasic {
    user_id: string;
    role: string;
}

/**
 * Get all projects accessible to the current user
 */
export async function getProjects(): Promise<ProjectWithDetails[]> {
    // First, get projects with basic page info
    const { data, error } = await supabase
        .from('projects')
        .select(`
            *,
            pages (id, name, slug, status, created_at, updated_at),
            project_members (user_id, role)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
        throw error;
    }

    // For each project, fetch SEO and content data for its pages
    const projectsWithData = await Promise.all((data || []).map(async (project) => {
        const pagesWithData = await Promise.all((project.pages || []).map(async (page: any) => {
            // Fetch latest SEO data for this page
            const { data: seoData } = await supabase
                .from('seo_data')
                .select('id, primary_keywords, secondary_keywords, uploaded_by, uploaded_at, version')
                .eq('page_id', page.id)
                .order('version', { ascending: false })
                .limit(1)
                .single();

            // Fetch latest content data for this page
            const { data: contentData } = await supabase
                .from('content_data')
                .select('id, parsed_content, google_sheet_url, uploaded_by, uploaded_at, version')
                .eq('page_id', page.id)
                .order('version', { ascending: false })
                .limit(1)
                .single();

            // Fetch latest analysis for this page
            const { data: analysisData } = await supabase
                .from('analysis_results')
                .select('id, overall_score, seo_score, readability_score, keyword_density_score, grammar_score, content_intent_score, technical_health_score, detailed_feedback')
                .eq('page_id', page.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            return {
                ...page,
                seo_data: seoData || undefined,
                content_data: contentData || undefined,
                analysis_results: analysisData || undefined,
            };
        }));

        return {
            ...project,
            pages: pagesWithData,
            members: project.project_members || [],
        };
    }));

    return projectsWithData;
}

/**
 * Get a single project by ID with all details
 */
export async function getProjectById(projectId: string): Promise<ProjectWithDetails | null> {
    const { data, error } = await supabase
        .from('projects')
        .select(`
            *,
            pages (id, name, slug, status, created_at, updated_at),
            project_members (user_id, role, joined_at)
        `)
        .eq('id', projectId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        console.error('Error fetching project:', error);
        throw error;
    }

    // Fetch SEO and content data for each page
    const pagesWithData = await Promise.all((data?.pages || []).map(async (page: any) => {
        const { data: seoData } = await supabase
            .from('seo_data')
            .select('id, primary_keywords, secondary_keywords, uploaded_by, uploaded_at, version')
            .eq('page_id', page.id)
            .order('version', { ascending: false })
            .limit(1)
            .single();

        const { data: contentData } = await supabase
            .from('content_data')
            .select('id, parsed_content, google_sheet_url, uploaded_by, uploaded_at, version')
            .eq('page_id', page.id)
            .order('version', { ascending: false })
            .limit(1)
            .single();

        const { data: analysisData } = await supabase
            .from('analysis_results')
            .select('id, overall_score, seo_score, readability_score, keyword_density_score, grammar_score, content_intent_score, technical_health_score, detailed_feedback')
            .eq('page_id', page.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        return {
            ...page,
            seo_data: seoData || undefined,
            content_data: contentData || undefined,
            analysis_results: analysisData || undefined,
        };
    }));

    return {
        ...data,
        pages: pagesWithData,
        members: data?.project_members || [],
    };
}

/**
 * Create a new project
 */
export async function createProject(project: {
    name: string;
    website_url: string;
    description?: string;
    created_by: string; // User ID passed in
}): Promise<Project> {
    console.log('createProject service: inserting project for user:', project.created_by);

    try {
        const { data, error } = await supabase
            .from('projects')
            .insert({
                name: project.name,
                website_url: project.website_url,
                description: project.description || null,
                created_by: project.created_by,
            })
            .select('*')
            .single();

        console.log('createProject service: result:', { data, error });

        if (error) {
            console.error('Error creating project:', error);
            throw error;
        }

        if (!data) {
            throw new Error('No data returned from insert');
        }

        return data;
    } catch (err) {
        console.error('createProject service: caught error:', err);
        throw err;
    }
}

/**
 * Update an existing project
 */
export async function updateProject(
    projectId: string,
    updates: ProjectUpdate
): Promise<Project> {
    const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

    if (error) {
        console.error('Error updating project:', error);
        throw error;
    }

    return data;
}

/**
 * Delete a project (admin only)
 */
export async function deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

    if (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
}

/**
 * Add a member to a project
 */
export async function addProjectMember(
    projectId: string,
    userId: string,
    role: 'seo_analyst' | 'content_writer' | 'content_verifier'
): Promise<void> {
    const { error } = await supabase
        .from('project_members')
        .insert({
            project_id: projectId,
            user_id: userId,
            role,
        });

    if (error) {
        console.error('Error adding project member:', error);
        throw error;
    }
}
