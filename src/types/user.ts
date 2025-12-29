export type UserRole = 'admin' | 'seo_analyst' | 'content_writer' | 'content_verifier';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar_url?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ProjectMember {
    user_id: string;
    role: UserRole;
    joined_at: string;
}
