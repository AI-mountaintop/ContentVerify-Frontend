import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FolderPlus,
    FilePlus,
    Upload,
    CheckCircle,
    XCircle,
    RotateCcw,
    MessageSquare,
    Sparkles
} from 'lucide-react';

// Mock activity data
const mockActivities = [
    {
        id: '1',
        type: 'approval',
        icon: CheckCircle,
        color: 'text-green-600 bg-green-100',
        message: 'Sam Chen approved "Home Page"',
        project: 'Velocity Pumps Website',
        projectId: '1',
        pageId: '1-1',
        time: '10 minutes ago',
    },
    {
        id: '2',
        type: 'comment',
        icon: MessageSquare,
        color: 'text-blue-600 bg-blue-100',
        message: 'Alex Rivera commented on "About Us"',
        project: 'Velocity Pumps Website',
        projectId: '1',
        pageId: '1-2',
        time: '30 minutes ago',
    },
    {
        id: '3',
        type: 'analysis',
        icon: Sparkles,
        color: 'text-purple-600 bg-purple-100',
        message: 'Analysis completed for "Products" - Score: 92%',
        project: 'Velocity Pumps Website',
        projectId: '1',
        pageId: '1-3',
        time: '1 hour ago',
    },
    {
        id: '4',
        type: 'upload',
        icon: Upload,
        color: 'text-orange-600 bg-orange-100',
        message: 'Jordan Lee uploaded content for "Home Page"',
        project: 'Velocity Pumps Website',
        projectId: '1',
        pageId: '1-1',
        time: '2 hours ago',
    },
    {
        id: '5',
        type: 'revision',
        icon: RotateCcw,
        color: 'text-yellow-600 bg-yellow-100',
        message: 'Sam Chen requested revision on "Contact"',
        project: 'Velocity Pumps Website',
        projectId: '1',
        pageId: '1-4',
        time: '3 hours ago',
    },
    {
        id: '6',
        type: 'upload',
        icon: Upload,
        color: 'text-orange-600 bg-orange-100',
        message: 'Alex Rivera uploaded SEO keywords for "About Us"',
        project: 'Velocity Pumps Website',
        projectId: '1',
        pageId: '1-2',
        time: '4 hours ago',
    },
    {
        id: '7',
        type: 'page',
        icon: FilePlus,
        color: 'text-gray-600 bg-gray-100',
        message: 'New page "Blog" added',
        project: 'TechStart Blog',
        projectId: '2',
        time: '5 hours ago',
    },
    {
        id: '8',
        type: 'project',
        icon: FolderPlus,
        color: 'text-indigo-600 bg-indigo-100',
        message: 'New project "GreenLeaf E-commerce" created',
        projectId: '3',
        time: '1 day ago',
    },
    {
        id: '9',
        type: 'rejection',
        icon: XCircle,
        color: 'text-red-600 bg-red-100',
        message: 'Sam Chen rejected "Landing Page" - Needs major revision',
        project: 'TechStart Blog',
        projectId: '2',
        pageId: '2-1',
        time: '1 day ago',
    },
];

const ActivityPage: React.FC = () => {
    const [filter, setFilter] = useState<'all' | 'my' | 'mentions'>('all');

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">Activity</h1>

            {/* Filters */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
                {(['all', 'my', 'mentions'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-smooth ${filter === tab
                                ? 'bg-white text-[var(--color-text-primary)] shadow-sm'
                                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                            }`}
                    >
                        {tab === 'all' ? 'All Activity' : tab === 'my' ? 'My Activity' : 'Mentions'}
                    </button>
                ))}
            </div>

            {/* Activity Timeline */}
            <div className="space-y-4">
                {mockActivities.map((activity) => {
                    const Icon = activity.icon;
                    return (
                        <div
                            key={activity.id}
                            className="flex gap-4 bg-white border border-[var(--color-border)] rounded-lg p-4 hover:shadow-sm transition-smooth"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                                <Icon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[var(--color-text-primary)]">{activity.message}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {activity.project && (
                                        <Link
                                            to={`/projects/${activity.projectId}`}
                                            className="text-sm text-[var(--color-accent)] hover:underline"
                                        >
                                            {activity.project}
                                        </Link>
                                    )}
                                    <span className="text-sm text-[var(--color-text-tertiary)]">• {activity.time}</span>
                                </div>
                            </div>
                            {activity.pageId && (
                                <Link
                                    to={`/projects/${activity.projectId}/pages/${activity.pageId}`}
                                    className="text-sm text-[var(--color-accent)] hover:underline self-center"
                                >
                                    View
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ActivityPage;
