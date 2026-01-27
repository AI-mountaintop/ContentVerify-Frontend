import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Loader2 } from 'lucide-react';
import ProjectCard from '../../components/projects/ProjectCard';
import EmptyState from '../../components/ui/EmptyState';
import { useProjectStore } from '../../stores/projectStore';
import { useAuth } from '../../contexts/AuthContext';

const ProjectsListPage: React.FC = () => {
    const { user } = useAuth();
    const { projects, isLoading, error, fetchProjects, addProject, clearError } = useProjectStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'my' | 'recent'>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [duplicateNameError, setDuplicateNameError] = useState('');

    // Form state
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectUrl, setNewProjectUrl] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');

    // Fetch projects on mount only
    useEffect(() => {
        fetchProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Apply filters and search
    const filteredProjects = useMemo(() => {
        let result = [...projects];

        // Apply filter first
        if (filter === 'my') {
            // Show only projects created by current user
            result = result.filter(project => project.created_by === user?.id);
        } else if (filter === 'recent') {
            // Show projects updated in the last 7 days, sorted by most recent
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            result = result
                .filter(project => {
                    const updatedAt = new Date(project.updated_at);
                    return updatedAt >= sevenDaysAgo;
                })
                .sort((a, b) => {
                    const dateA = new Date(a.updated_at).getTime();
                    const dateB = new Date(b.updated_at).getTime();
                    return dateB - dateA; // Most recent first
                });
        } else {
            // 'all' - show all projects, sorted by most recent
            result = result.sort((a, b) => {
                const dateA = new Date(a.updated_at).getTime();
                const dateB = new Date(b.updated_at).getTime();
                return dateB - dateA; // Most recent first
            });
        }

        // Apply search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(project =>
                project.name.toLowerCase().includes(query) ||
                project.website_url.toLowerCase().includes(query) ||
                (project.description && project.description.toLowerCase().includes(query))
            );
        }

        return result;
    }, [projects, filter, searchQuery, user?.id]);

    // Check for duplicate project name
    const checkDuplicateName = (name: string): boolean => {
        if (!name.trim()) return false;
        const trimmedName = name.trim().toLowerCase();
        return projects.some(project => project.name.toLowerCase() === trimmedName);
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim() || !newProjectUrl.trim() || !user) return;

        // Check for duplicate name
        if (checkDuplicateName(newProjectName)) {
            setDuplicateNameError(`A project with the name "${newProjectName.trim()}" already exists. Please choose a different name.`);
            return;
        }

        setDuplicateNameError('');
        setIsCreating(true);
        
        try {
            const result = await addProject(newProjectName, newProjectUrl, newProjectDesc || undefined, user.id);
            
            if (result) {
                // Reset form and close modal
                setNewProjectName('');
                setNewProjectUrl('');
                setNewProjectDesc('');
                setDuplicateNameError('');
                setShowCreateModal(false);
            }
        } catch (error: any) {
            // Handle backend error (in case frontend check missed it)
            if (error.message?.includes('already exists')) {
                setDuplicateNameError(error.message);
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleNameChange = (value: string) => {
        setNewProjectName(value);
        // Clear duplicate error when user starts typing
        if (duplicateNameError) {
            setDuplicateNameError('');
        }
    };

    // Any authenticated user can create projects
    const canCreateProject = !!user;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Projects</h1>
                {canCreateProject && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-md hover:opacity-90 transition-smooth font-medium"
                    >
                        <Plus size={18} />
                        Create Project
                    </button>
                )}
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center justify-between">
                    <p className="text-red-700 text-sm">{error}</p>
                    <button onClick={clearError} className="text-red-500 hover:text-red-700 text-sm">
                        Dismiss
                    </button>
                </div>
            )}

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Filter Tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    {(['all', 'my', 'recent'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-smooth ${filter === tab ? 'bg-white text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                        >
                            {tab === 'all' ? 'All' : tab === 'my' ? 'My Projects' : 'Recent'}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-[var(--color-border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                    />
                </div>
            </div>

            {/* Loading State */}
            {isLoading && projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)] mb-4" />
                    <p className="text-[var(--color-text-secondary)]">Loading projects...</p>
                </div>
            ) : filteredProjects.length > 0 ? (
                /* Projects Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="No projects found"
                    description={
                        searchQuery 
                            ? `No projects match "${searchQuery}". Try adjusting your search criteria.`
                            : filter === 'my'
                            ? "You haven't created any projects yet."
                            : filter === 'recent'
                            ? "No projects have been updated recently."
                            : 'Create your first project to get started'
                    }
                    actionLabel={!searchQuery && filter === 'all' && canCreateProject ? 'Create Project' : undefined}
                    onAction={!searchQuery && filter === 'all' && canCreateProject ? () => setShowCreateModal(true) : undefined}
                />
            )}

            {/* Create Project Modal */}
            {showCreateModal && (
                <div 
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setShowCreateModal(false)}
                >
                    <div 
                        className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                    Project Name *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Company Website"
                                    value={newProjectName}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    required
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${
                                        duplicateNameError 
                                            ? 'border-red-500 focus:ring-red-500' 
                                            : 'border-[var(--color-border)]'
                                    }`}
                                />
                                {duplicateNameError && (
                                    <p className="mt-1 text-sm text-red-600">{duplicateNameError}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                    Website URL *
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://example.com"
                                    value={newProjectUrl}
                                    onChange={(e) => setNewProjectUrl(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                    Description (optional)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Brief description of the project..."
                                    value={newProjectDesc}
                                    onChange={(e) => setNewProjectDesc(e.target.value)}
                                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={isCreating}
                                    className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-md text-[var(--color-text-secondary)] hover:bg-gray-50 transition-smooth disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || !!duplicateNameError}
                                    className="flex-1 px-4 py-2 bg-[var(--color-accent)] text-white rounded-md hover:opacity-90 transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isCreating && <Loader2 size={16} className="animate-spin" />}
                                    {isCreating ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectsListPage;
