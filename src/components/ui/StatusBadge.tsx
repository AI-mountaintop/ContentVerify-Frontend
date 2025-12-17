import React from 'react';
import type { PageStatus } from '../../types/project';

interface StatusBadgeProps {
    status: PageStatus;
    size?: 'sm' | 'md';
}

const statusConfig: Record<PageStatus, { label: string; className: string }> = {
    draft: {
        label: 'Draft',
        className: 'bg-gray-100 text-gray-600',
    },
    awaiting_seo: {
        label: 'Awaiting SEO',
        className: 'bg-orange-100 text-orange-700',
    },
    awaiting_content: {
        label: 'Awaiting Content',
        className: 'bg-yellow-100 text-yellow-700',
    },
    processing: {
        label: 'Processing',
        className: 'bg-blue-100 text-blue-700',
    },
    pending_review: {
        label: 'Pending Review',
        className: 'bg-purple-100 text-purple-700',
    },
    revision_requested: {
        label: 'Revision Requested',
        className: 'bg-orange-100 text-orange-700',
    },
    approved: {
        label: 'Approved',
        className: 'bg-green-100 text-green-700',
    },
    rejected: {
        label: 'Rejected',
        className: 'bg-red-100 text-red-700',
    },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
    const config = statusConfig[status];
    const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

    return (
        <span className={`inline-flex items-center rounded-full font-medium ${config.className} ${sizeClasses}`}>
            {config.label}
        </span>
    );
};

export default StatusBadge;
