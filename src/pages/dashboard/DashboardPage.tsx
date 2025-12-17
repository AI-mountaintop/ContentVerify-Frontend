import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectStore } from '../../stores/projectStore';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const { projects } = useProjectStore();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const getRoleStats = () => {
        if (!user) return { stat1: 0, stat2: 0, stat3: 0 };

        const allPages = projects.flatMap(p => p.pages);

        switch (user.role) {
            case 'seo_analyst':
                return {
                    label1: 'Pages awaiting keywords',
                    stat1: allPages.filter(p => p.status === 'awaiting_seo' || p.status === 'draft').length,
                    label2: 'Keywords uploaded this week',
                    stat2: allPages.filter(p => p.seo_data).length,
                    label3: 'Revision requests',
                    stat3: allPages.filter(p => p.status === 'revision_requested' && p.seo_data).length,
                };
            case 'content_writer':
                return {
                    label1: 'Pages awaiting content',
                    stat1: allPages.filter(p => p.status === 'awaiting_content').length,
                    label2: 'Content uploaded this week',
                    stat2: allPages.filter(p => p.content_data).length,
                    label3: 'Revision requests',
                    stat3: allPages.filter(p => p.status === 'revision_requested' && p.content_data).length,
                };
            case 'content_verifier':
                return {
                    label1: 'Pending reviews',
                    stat1: allPages.filter(p => p.status === 'pending_review').length,
                    label2: 'Approved this week',
                    stat2: allPages.filter(p => p.status === 'approved').length,
                    label3: 'Rejected this week',
                    stat3: allPages.filter(p => p.status === 'rejected').length,
                };
            default:
                return { label1: '', stat1: 0, label2: '', stat2: 0, label3: '', stat3: 0 };
        }
    };

    const stats = getRoleStats();

    return (
        <div className="p-8">
            {/* Welcome Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                    {getGreeting()}, {user?.name}
                </h1>
                <p className="text-text-secondary">
                    Here's what's happening with your projects today.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-bg-secondary p-6 rounded-lg border border-border shadow-sm">
                    <p className="text-text-secondary text-sm mb-1">{stats.label1}</p>
                    <p className="text-4xl font-bold text-text-primary">{stats.stat1}</p>
                </div>
                <div className="bg-bg-secondary p-6 rounded-lg border border-border shadow-sm">
                    <p className="text-text-secondary text-sm mb-1">{stats.label2}</p>
                    <p className="text-4xl font-bold text-text-primary">{stats.stat2}</p>
                </div>
                <div className="bg-bg-secondary p-6 rounded-lg border border-border shadow-sm">
                    <p className="text-text-secondary text-sm mb-1">{stats.label3}</p>
                    <p className="text-4xl font-bold text-text-primary">{stats.stat3}</p>
                </div>
            </div>

            {/* Recent Projects */}
            <div className="bg-bg-secondary p-6 rounded-lg border border-border shadow-sm">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Recent Projects</h2>
                <div className="space-y-3">
                    {projects.slice(0, 3).map(project => (
                        <Link
                            key={project.id}
                            to={`/projects/${project.id}`}
                            className="flex items-center justify-between p-4 bg-bg-tertiary rounded-md hover:bg-bg-primary transition-smooth cursor-pointer"
                        >
                            <div>
                                <h3 className="font-medium text-text-primary">{project.name}</h3>
                                <p className="text-sm text-text-secondary">{project.website_url}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-text-secondary">
                                    {project.pages.length} pages
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
