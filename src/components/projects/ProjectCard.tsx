import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, FileText } from 'lucide-react';
import type { Project } from '../../types/project';

interface ProjectCardProps {
    project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
    const approvedPages = project.pages.filter(p => p.status === 'approved').length;
    const pendingPages = project.pages.filter(p => p.status === 'pending_review').length;
    const totalPages = project.pages.length;
    const progress = totalPages > 0 ? (approvedPages / totalPages) * 100 : 0;

    return (
        <Link
            to={`/projects/${project.id}`}
            className="block bg-white border border-[var(--color-border)] rounded-lg p-5 hover:shadow-md hover:border-[var(--color-accent)] transition-smooth"
        >
            <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] truncate">{project.name}</h3>
                <a
                    href={project.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-smooth"
                >
                    <ExternalLink size={16} />
                </a>
            </div>

            <p className="text-sm text-[var(--color-text-tertiary)] mb-3 truncate">{project.website_url}</p>

            {project.description && (
                <p className="text-sm text-[var(--color-text-secondary)] mb-4 line-clamp-2">{project.description}</p>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)] mb-4">
                <span className="flex items-center gap-1">
                    <FileText size={14} />
                    {totalPages} pages
                </span>
                {pendingPages > 0 && (
                    <span className="text-orange-600">{pendingPages} pending</span>
                )}
                {approvedPages > 0 && (
                    <span className="text-green-600">{approvedPages} approved</span>
                )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                {approvedPages}/{totalPages} pages approved
            </p>
        </Link>
    );
};

export default ProjectCard;
