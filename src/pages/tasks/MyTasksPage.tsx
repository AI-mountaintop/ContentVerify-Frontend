import React from 'react';
import { Link } from 'react-router-dom';
import { Tag, FileText, Eye, ArrowRight } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectStore } from '../../stores/projectStore';

const MyTasksPage: React.FC = () => {
    const { user } = useAuth();
    const { projects } = useProjectStore();

    // Generate tasks based on role
    const getTasks = () => {
        const allPages = projects.flatMap(p =>
            p.pages.map(page => ({ ...page, projectName: p.name, projectId: p.id }))
        );

        if (user?.role === 'seo_analyst') {
            return allPages
                .filter(p => !p.seo_data || p.status === 'revision_requested')
                .map(p => ({
                    id: p.id,
                    type: 'seo' as const,
                    projectName: p.projectName,
                    projectId: p.projectId,
                    pageName: p.name,
                    pageId: p.id,
                    action: p.seo_data ? 'Revise Keywords' : 'Upload Keywords',
                    status: p.status,
                    urgency: p.status === 'revision_requested' ? 'high' : 'normal',
                }));
        }

        if (user?.role === 'content_writer') {
            return allPages
                .filter(p => !p.content_data || p.status === 'revision_requested')
                .map(p => ({
                    id: p.id,
                    type: 'content' as const,
                    projectName: p.projectName,
                    projectId: p.projectId,
                    pageName: p.name,
                    pageId: p.id,
                    action: p.content_data ? 'Revise Content' : 'Upload Content',
                    status: p.status,
                    urgency: p.status === 'revision_requested' ? 'high' : 'normal',
                }));
        }

        if (user?.role === 'content_verifier') {
            return allPages
                .filter(p => p.status === 'pending_review')
                .map(p => ({
                    id: p.id,
                    type: 'review' as const,
                    projectName: p.projectName,
                    projectId: p.projectId,
                    pageName: p.name,
                    pageId: p.id,
                    action: 'Review & Approve',
                    status: p.status,
                    urgency: 'normal' as const,
                    score: p.analysis?.overall_score,
                }));
        }

        return [];
    };

    const tasks = getTasks();
    const urgentTasks = tasks.filter(t => t.urgency === 'high');
    const normalTasks = tasks.filter(t => t.urgency !== 'high');

    const getTaskIcon = (type: string) => {
        switch (type) {
            case 'seo': return Tag;
            case 'content': return FileText;
            case 'review': return Eye;
            default: return FileText;
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">My Tasks</h1>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-[var(--color-border)] rounded-lg p-4">
                    <p className="text-sm text-[var(--color-text-secondary)]">Total Tasks</p>
                    <p className="text-3xl font-bold text-[var(--color-text-primary)]">{tasks.length}</p>
                </div>
                <div className="bg-white border border-[var(--color-border)] rounded-lg p-4">
                    <p className="text-sm text-[var(--color-text-secondary)]">Urgent</p>
                    <p className="text-3xl font-bold text-red-600">{urgentTasks.length}</p>
                </div>
                <div className="bg-white border border-[var(--color-border)] rounded-lg p-4">
                    <p className="text-sm text-[var(--color-text-secondary)]">Pending</p>
                    <p className="text-3xl font-bold text-orange-600">{normalTasks.length}</p>
                </div>
            </div>

            {/* Urgent Tasks */}
            {urgentTasks.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-red-600 mb-3">🔴 Urgent - Revision Requested</h2>
                    <div className="space-y-2">
                        {urgentTasks.map(task => {
                            const Icon = getTaskIcon(task.type);
                            return (
                                <Link
                                    key={task.id}
                                    to={`/projects/${task.projectId}/pages/${task.pageId}`}
                                    className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-4 hover:bg-red-100 transition-smooth"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                            <Icon size={20} className="text-red-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--color-text-primary)]">{task.pageName}</p>
                                            <p className="text-sm text-[var(--color-text-secondary)]">{task.projectName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-medium text-red-600">{task.action}</span>
                                        <ArrowRight size={16} className="text-red-400" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Normal Tasks */}
            {normalTasks.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Pending Tasks</h2>
                    <div className="space-y-2">
                        {normalTasks.map(task => {
                            const Icon = getTaskIcon(task.type);
                            return (
                                <Link
                                    key={task.id}
                                    to={`/projects/${task.projectId}/pages/${task.pageId}`}
                                    className="flex items-center justify-between bg-white border border-[var(--color-border)] rounded-lg p-4 hover:border-[var(--color-accent)] hover:shadow-sm transition-smooth"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                            <Icon size={20} className="text-[var(--color-text-secondary)]" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--color-text-primary)]">{task.pageName}</p>
                                            <p className="text-sm text-[var(--color-text-secondary)]">{task.projectName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <StatusBadge status={task.status} size="sm" />
                                        {task.type === 'review' && 'score' in task && typeof task.score === 'number' && (
                                            <span className={`font-bold ${task.score >= 80 ? 'text-green-600' : task.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                {task.score}%
                                            </span>
                                        )}
                                        <span className="text-sm font-medium text-[var(--color-accent)]">{task.action}</span>
                                        <ArrowRight size={16} className="text-gray-400" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {tasks.length === 0 && (
                <div className="bg-white border border-[var(--color-border)] rounded-lg p-12 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">✓</span>
                    </div>
                    <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-1">All caught up!</h3>
                    <p className="text-[var(--color-text-secondary)]">You have no pending tasks at the moment.</p>
                </div>
            )}
        </div>
    );
};

export default MyTasksPage;
