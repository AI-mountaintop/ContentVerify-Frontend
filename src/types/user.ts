export type UserRole = 'seo_analyst' | 'content_writer' | 'content_verifier';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
}

export interface ProjectMember {
    user_id: string;
    role: UserRole;
    joined_at: string;
}
