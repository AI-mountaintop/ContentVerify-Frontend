import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import ProjectCard from '../../components/projects/ProjectCard';
import EmptyState from '../../components/ui/EmptyState';
import { useProjectStore } from '../../stores/projectStore';

const ProjectsListPage: React.FC = () => {
    const { projects, addProject } = useProjectStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'my' | 'recent'>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form state
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectUrl, setNewProjectUrl] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.website_url.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim() || !newProjectUrl.trim()) return;

        addProject(newProjectName, newProjectUrl, newProjectDesc || undefined);

        // Reset form and close modal
        setNewProjectName('');
        setNewProjectUrl('');
        setNewProjectDesc('');
        setShowCreateModal(false);
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Projects</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-md hover:opacity-90 transition-smooth font-medium"
                >
                    <Plus size={18} />
                    Create Project
                </button>
            </div>

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

            {/* Projects Grid */}
            {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="No projects found"
                    description={searchQuery ? 'Try adjusting your search criteria' : 'Create your first project to get started'}
                    actionLabel={!searchQuery ? 'Create Project' : undefined}
                    onAction={!searchQuery ? () => setShowCreateModal(true) : undefined}
                />
            )}

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
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
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                                />
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
                                    className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-md text-[var(--color-text-secondary)] hover:bg-gray-50 transition-smooth"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[var(--color-accent)] text-white rounded-md hover:opacity-90 transition-smooth"
                                >
                                    Create Project
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
