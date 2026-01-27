import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, ExternalLink, Settings, ArrowLeft, Trash2, Loader2, Users } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import DataStatusIndicator from '../../components/ui/DataStatusIndicator';
import TargetPersonasDisplay from '../../components/personas/TargetPersonasDisplay';
import { useProjectStore } from '../../stores/projectStore';
import { useAuth } from '../../contexts/AuthContext';
import { getProjectMembers, addProjectMember, removeProjectMember, getUsersForAssignment } from '../../services/projectService';
import type { User } from '../../types/user';

const ProjectDetailPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { projects, addPage, error: storeError } = useProjectStore();
    const { user } = useAuth();
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'needs_work'>('all');
    const [showAddPageModal, setShowAddPageModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // Admin, SEO Analyst, and Content Writer can create pages
    const canCreatePage = user?.role === 'admin' || user?.role === 'seo_analyst' || user?.role === 'content_writer';
    const canEditProject = user?.role === 'admin' || user?.role === 'seo_analyst';

    // Page Form state
    const [newPageName, setNewPageName] = useState('');
    const [newPageSlug, setNewPageSlug] = useState('');
    const [pageDuplicateError, setPageDuplicateError] = useState('');
    const [isAddingPage, setIsAddingPage] = useState(false);

    // Project Settings Form state
    const [editName, setEditName] = useState('');
    const [editWebsiteUrl, setEditWebsiteUrl] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editDriveUrl, setEditDriveUrl] = useState('');
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Member Management state
    const [projectMembers, setProjectMembers] = useState<Array<{ id: string; user_id: string; role: string; user: { id: string; name: string; email: string; role: string; avatar_url?: string | null } }>>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [newMemberUserId, setNewMemberUserId] = useState('');
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [memberError, setMemberError] = useState('');
    const [memberSuccess, setMemberSuccess] = useState('');

    const project = projects.find(p => p.id === projectId);

    if (!project) {
        return (
            <div className="p-8">
                <p className="text-[var(--color-text-secondary)]">Project not found</p>
            </div>
        );
    }

    const filteredPages = project.pages.filter(page => {
        if (filter === 'all') return true;
        if (filter === 'pending') return page.status === 'pending_review';
        if (filter === 'approved') return page.status === 'approved';
        if (filter === 'needs_work') return ['revision_requested', 'awaiting_seo', 'awaiting_content'].includes(page.status);
        return true;
    });

    const stats = {
        total: project.pages.length,
        pending: project.pages.filter(p => p.status === 'pending_review').length,
        approved: project.pages.filter(p => p.status === 'approved').length,
        avgScore: project.pages.filter(p => p.analysis).reduce((acc, p) => acc + (p.analysis?.overall_score || 0), 0) /
            (project.pages.filter(p => p.analysis).length || 1),
    };

    // Check for duplicate page slug
    const checkDuplicateSlug = (slug: string): boolean => {
        if (!slug.trim() || !project) return false;
        const trimmedSlug = slug.trim().toLowerCase();
        return project.pages?.some(page => page.slug.toLowerCase() === trimmedSlug) || false;
    };

    const handleAddPage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPageName.trim() || !newPageSlug.trim() || !projectId) return;

        // Check for duplicate slug
        if (checkDuplicateSlug(newPageSlug)) {
            setPageDuplicateError(`A page with the slug "${newPageSlug.trim()}" already exists in this project. Please choose a different slug.`);
            return;
        }

        setPageDuplicateError('');
        setIsAddingPage(true);

        try {
            const result = await addPage(projectId, newPageName, newPageSlug);
            
            if (result) {
                // Success - reset form and close modal
                setNewPageName('');
                setNewPageSlug('');
                setPageDuplicateError('');
                setShowAddPageModal(false);
            } else {
                // Error occurred - check store error
                if (storeError) {
                    setPageDuplicateError(storeError.includes('already exists') || storeError.includes('duplicate') 
                        ? storeError 
                        : `Failed to create page: ${storeError}`);
                } else {
                    setPageDuplicateError('Failed to create page. Please try again.');
                }
            }
        } catch (error: any) {
            // Handle backend error
            if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
                setPageDuplicateError(error.message);
            } else {
                setPageDuplicateError(`Failed to create page: ${error.message || 'Unknown error'}`);
            }
        } finally {
            setIsAddingPage(false);
        }
    };

    const handleOpenSettings = async () => {
        if (project && projectId) {
            setEditName(project.name);
            setEditWebsiteUrl(project.website_url);
            setEditDescription(project.description || '');
            setEditDriveUrl(project.google_drive_url || '');
            setShowSettingsModal(true);
            
            // Fetch members and users
            await fetchProjectMembers();
            await fetchAllUsers();
        }
    };

    const fetchProjectMembers = async () => {
        if (!projectId) return;
        setIsLoadingMembers(true);
        setMemberError('');
        try {
            console.log('Fetching project members for project:', projectId);
            const members = await getProjectMembers(projectId);
            console.log('Fetched members:', members);
            setProjectMembers(members);
        } catch (err: any) {
            console.error('Error fetching project members:', err);
            setMemberError(err.message || 'Failed to load project members');
        } finally {
            setIsLoadingMembers(false);
        }
    };

    const fetchAllUsers = async () => {
        setIsLoadingUsers(true);
        try {
            // Fetch users for project assignment (Admin/SEO Analyst only)
            const users = await getUsersForAssignment();
            setAllUsers(users);
        } catch (err: any) {
            // If user doesn't have permission, this will fail
            console.warn('Could not fetch users for assignment:', err);
            setAllUsers([]);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId || !newMemberUserId) return;

        // Get the selected user's system role and map it to project role
        const selectedUser = allUsers.find(u => u.id === newMemberUserId);
        if (!selectedUser) {
            setMemberError('Selected user not found');
            return;
        }

        // Map user's system role to project role
        // Admin defaults to seo_analyst (since admin is not a valid project role)
        let projectRole: 'seo_analyst' | 'content_writer' | 'content_verifier';
        if (selectedUser.role === 'admin' || selectedUser.role === 'seo_analyst') {
            projectRole = 'seo_analyst';
        } else if (selectedUser.role === 'content_writer') {
            projectRole = 'content_writer';
        } else if (selectedUser.role === 'content_verifier') {
            projectRole = 'content_verifier';
        } else {
            // Fallback
            projectRole = 'content_writer';
        }

        setIsAddingMember(true);
        setMemberError('');
        setMemberSuccess('');

        try {
            console.log('Adding member:', { projectId, userId: newMemberUserId, role: projectRole });
            await addProjectMember(projectId, newMemberUserId, projectRole);
            console.log('Member added successfully, refreshing lists...');
            setMemberSuccess('Member added successfully');
            setNewMemberUserId('');
            // Refresh both members and users list
            await Promise.all([
                fetchProjectMembers(),
                fetchAllUsers()
            ]);
            console.log('Lists refreshed');
            setTimeout(() => setMemberSuccess(''), 3000);
        } catch (err: any) {
            console.error('Error adding member:', err);
            const errorMessage = err?.message || err?.error?.message || 'Failed to add member';
            setMemberError(errorMessage);
            // Clear error after 5 seconds
            setTimeout(() => setMemberError(''), 5000);
        } finally {
            setIsAddingMember(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!projectId) return;
        if (!confirm('Are you sure you want to remove this member from the project?')) return;

        setMemberError('');
        setMemberSuccess('');

        try {
            await removeProjectMember(projectId, userId);
            setMemberSuccess('Member removed successfully');
            await fetchProjectMembers();
            setTimeout(() => setMemberSuccess(''), 3000);
        } catch (err: any) {
            setMemberError(err.message || 'Failed to remove member');
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-purple-100 text-purple-700';
            case 'seo_analyst':
                return 'bg-info-light text-info';
            case 'content_writer':
                return 'bg-warning-light text-warning';
            case 'content_verifier':
                return 'bg-success-light text-success';
            default:
                return 'bg-bg-tertiary text-text-secondary';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin':
                return 'Administrator';
            case 'seo_analyst':
                return 'SEO Analyst';
            case 'content_writer':
                return 'Content Writer';
            case 'content_verifier':
                return 'Content Verifier';
            default:
                return role;
        }
    };

    // Filter out users who are already members
    const availableUsers = allUsers.filter(
        (u) => !projectMembers.some((m) => m.user_id === u.id)
    );

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId || !editName.trim() || !editWebsiteUrl.trim()) return;

        setIsSavingSettings(true);
        try {
            await useProjectStore.getState().updateProject(projectId, {
                name: editName,
                website_url: editWebsiteUrl,
                description: editDescription,
                google_drive_url: editDriveUrl,
            });
            setShowSettingsModal(false);
        } catch (error) {
            console.error('Error updating project settings:', error);
        } finally {
            setIsSavingSettings(false);
        }
    };

    // Auto-generate slug from name
    const handleNameChange = (name: string) => {
        setNewPageName(name);
        setNewPageSlug(name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    };

    return (
        <div className="p-8">
            {/* Back Link */}
            <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4">
                <ArrowLeft size={16} />
                Back to Projects
            </Link>

            {/* Project Header */}
            <div className="bg-white border border-[var(--color-border)] rounded-lg p-6 mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">{project.name}</h1>
                        <a
                            href={project.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-[var(--color-accent)] hover:underline"
                        >
                            {project.website_url}
                            <ExternalLink size={14} />
                        </a>
                        {project.description && (
                            <p className="text-[var(--color-text-secondary)] mt-2">{project.description}</p>
                        )}
                        {project.google_drive_url && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-text-tertiary)] bg-blue-50 w-fit px-2 py-1 rounded border border-blue-100">
                                <span className="font-semibold text-blue-700 uppercase">Drive Folder:</span>
                                <a href={project.google_drive_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600 truncate max-w-[300px]">
                                    {project.google_drive_url}
                                </a>
                            </div>
                        )}
                    </div>
                    {canEditProject && (
                        <button
                            onClick={handleOpenSettings}
                            className="p-2 hover:bg-gray-100 rounded-md transition-smooth"
                        >
                            <Settings size={20} className="text-[var(--color-text-secondary)]" />
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-[var(--color-border)] rounded-lg p-4">
                    <p className="text-sm text-[var(--color-text-secondary)]">Total Pages</p>
                    <p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.total}</p>
                </div>
                <div className="bg-white border border-[var(--color-border)] rounded-lg p-4">
                    <p className="text-sm text-[var(--color-text-secondary)]">Pending Review</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.pending}</p>
                </div>
                <div className="bg-white border border-[var(--color-border)] rounded-lg p-4">
                    <p className="text-sm text-[var(--color-text-secondary)]">Approved</p>
                    <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <div className="bg-white border border-[var(--color-border)] rounded-lg p-4">
                    <p className="text-sm text-[var(--color-text-secondary)]">Avg Score</p>
                    <p className="text-3xl font-bold text-[var(--color-accent)]">{Math.round(stats.avgScore)}%</p>
                </div>
            </div>

            {/* Target Personas Section */}
            <TargetPersonasDisplay projectId={project.id} className="mb-6" />

            {/* Filter Tabs and Add Page Button */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    {(['all', 'pending', 'approved', 'needs_work'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-smooth ${filter === tab ? 'bg-white text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                        >
                            {tab === 'all' ? 'All' : tab === 'pending' ? 'Pending' : tab === 'approved' ? 'Approved' : 'Needs Work'}
                        </button>
                    ))}
                </div>
                {canCreatePage && (
                    <button
                        onClick={() => {
                            setPageDuplicateError('');
                            setShowAddPageModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-md hover:opacity-90 transition-smooth font-medium text-sm"
                    >
                        <Plus size={16} />
                        Add Page
                    </button>
                )}
            </div>

            {/* Pages List */}
            <div className="space-y-2">
                {filteredPages.length === 0 ? (
                    <div className="bg-white border border-[var(--color-border)] rounded-lg p-8 text-center">
                        <p className="text-[var(--color-text-secondary)]">No pages found. Add your first page to get started.</p>
                    </div>
                ) : (
                    filteredPages.map(page => (
                        <Link
                            key={page.id}
                            to={`/projects/${projectId}/pages/${page.id}`}
                            className="block bg-white border border-[var(--color-border)] rounded-lg p-4 hover:shadow-md hover:border-[var(--color-accent)] transition-smooth"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <h3 className="font-medium text-[var(--color-text-primary)]">{page.name}</h3>
                                        <p className="text-sm text-[var(--color-text-tertiary)]">/{page.slug}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-4">
                                        <DataStatusIndicator
                                            hasData={!!page.seo_data}
                                            needsRevision={page.status === 'revision_requested'}
                                            label="SEO"
                                        />
                                        <DataStatusIndicator
                                            hasData={!!page.content_data}
                                            needsRevision={page.status === 'revision_requested'}
                                            label="Content"
                                        />
                                    </div>
                                    {page.analysis && (
                                        <div className="text-right">
                                            <span className={`text-lg font-bold ${page.analysis.overall_score >= 80 ? 'text-green-600' : page.analysis.overall_score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                {page.analysis.overall_score}%
                                            </span>
                                        </div>
                                    )}
                                    <StatusBadge status={page.status} size="sm" />
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>

            {/* Add Page Modal */}
            {showAddPageModal && (
                    <div 
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        onClick={() => {
                            setShowAddPageModal(false);
                            setPageDuplicateError('');
                        }}
                    >
                    <div 
                        className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-semibold mb-4">Add New Page</h2>
                        <form onSubmit={handleAddPage} className="space-y-4">
                            {pageDuplicateError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-sm text-red-700">{pageDuplicateError}</p>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                    Page Name *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Home Page, About Us"
                                    value={newPageName}
                                    onChange={(e) => {
                                        handleNameChange(e.target.value);
                                        if (pageDuplicateError) {
                                            setPageDuplicateError('');
                                        }
                                    }}
                                    required
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${
                                        pageDuplicateError 
                                            ? 'border-red-500 focus:ring-red-500' 
                                            : 'border-[var(--color-border)]'
                                    }`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                    Page Slug *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., home, about-us"
                                    value={newPageSlug}
                                    onChange={(e) => {
                                        setNewPageSlug(e.target.value);
                                        if (pageDuplicateError) {
                                            setPageDuplicateError('');
                                        }
                                    }}
                                    required
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${
                                        pageDuplicateError 
                                            ? 'border-red-500 focus:ring-red-500' 
                                            : 'border-[var(--color-border)]'
                                    }`}
                                />
                                <p className="mt-1 text-xs text-gray-500">URL-friendly identifier (lowercase, hyphens only)</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddPageModal(false);
                                        setPageDuplicateError('');
                                        setNewPageName('');
                                        setNewPageSlug('');
                                    }}
                                    disabled={isAddingPage}
                                    className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-md text-[var(--color-text-secondary)] hover:bg-gray-50 transition-smooth disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAddingPage || !!pageDuplicateError}
                                    className="flex-1 px-4 py-2 bg-[var(--color-accent)] text-white rounded-md hover:opacity-90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isAddingPage ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        'Add Page'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Project Settings Modal */}
            {showSettingsModal && (
                <div 
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto"
                    onClick={() => setShowSettingsModal(false)}
                >
                    <div 
                        className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-semibold mb-4">Project Settings</h2>
                        
                        {/* Tabs */}
                        <div className="flex gap-2 mb-6 border-b border-[var(--color-border)]">
                            <button className="px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] border-b-2 border-[var(--color-accent)]">
                                General
                            </button>
                            <button className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                                <Users size={16} className="inline mr-1" />
                                Team Members
                            </button>
                        </div>

                        {/* General Settings Form */}
                        <form onSubmit={handleUpdateSettings} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                    Project Name *
                                </label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
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
                                    value={editWebsiteUrl}
                                    onChange={(e) => setEditWebsiteUrl(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                    Google Drive Folder URL
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://drive.google.com/drive/folders/..."
                                    value={editDriveUrl}
                                    onChange={(e) => setEditDriveUrl(e.target.value)}
                                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                                />
                                <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1">
                                    Provide the URL of the folder containing Brand Strategy ("report") and Digital Trailmap documents.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSettingsModal(false);
                                        setMemberError('');
                                        setMemberSuccess('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-md text-[var(--color-text-secondary)] hover:bg-gray-50 transition-smooth"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingSettings}
                                    className="flex-1 px-4 py-2 bg-[var(--color-accent)] text-white rounded-md hover:opacity-90 transition-smooth disabled:opacity-50"
                                >
                                    {isSavingSettings ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>

                        {/* Team Members Section - Outside the form to avoid nesting */}
                        <div className="pt-4 border-t border-[var(--color-border)] mt-4">
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Users size={18} />
                                Team Members
                            </h3>

                            {/* Success/Error Messages */}
                            {memberSuccess && (
                                <div className="mb-3 p-2 bg-success-light text-success text-sm rounded-md">
                                    {memberSuccess}
                                </div>
                            )}
                            {memberError && (
                                <div className="mb-3 p-2 bg-error-light text-error text-sm rounded-md">
                                    {memberError}
                                </div>
                            )}

                            {/* Current Members */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Assigned Members
                                </label>
                                {isLoadingMembers ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-accent)]" />
                                    </div>
                                ) : projectMembers.length === 0 ? (
                                    <p className="text-sm text-[var(--color-text-secondary)] py-2">
                                        No members assigned yet
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {projectMembers.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] rounded-md border border-[var(--color-border)]"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={
                                                            member.user?.avatar_url ||
                                                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user?.email || 'default'}`
                                                        }
                                                        alt={member.user?.name || 'User'}
                                                        className="w-8 h-8 rounded-full"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                                            {member.user?.name || 'Unknown User'}
                                                        </p>
                                                        <p className="text-xs text-[var(--color-text-secondary)]">
                                                            {member.user?.email || ''}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`px-2 py-0.5 text-xs rounded-full font-medium ${getRoleBadgeColor(
                                                            member.user?.role || member.role
                                                        )}`}
                                                    >
                                                        {getRoleLabel(member.user?.role || member.role)}
                                                    </span>
                                                </div>
                                                {canEditProject && (
                                                    <button
                                                        onClick={() => handleRemoveMember(member.user_id)}
                                                        className="p-1.5 text-error hover:bg-error-light rounded-md transition-smooth"
                                                        title="Remove member"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Add Member Form - Separate form outside the settings form */}
                            {canEditProject && (
                                <div className="border-t border-[var(--color-border)] pt-4">
                                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                        Add Team Member
                                    </label>
                                    {isLoadingUsers ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="w-5 h-5 animate-spin text-[var(--color-accent)]" />
                                        </div>
                                    ) : availableUsers.length === 0 ? (
                                        <p className="text-sm text-[var(--color-text-secondary)] py-2">
                                            {allUsers.length === 0
                                                ? 'Unable to load users. Admin access required to add members.'
                                                : 'All users are already assigned to this project'}
                                        </p>
                                    ) : (
                                        <form onSubmit={handleAddMember} className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                                    Select User
                                                </label>
                                                <select
                                                    value={newMemberUserId}
                                                    onChange={(e) => setNewMemberUserId(e.target.value)}
                                                    required
                                                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                                                >
                                                    <option value="">Select a user...</option>
                                                    {availableUsers.map((user) => {
                                                        const roleLabel = user.role === 'admin' ? 'Admin' : 
                                                                          user.role === 'seo_analyst' ? 'SEO Analyst' : 
                                                                          user.role === 'content_writer' ? 'Content Writer' : 
                                                                          'Content Verifier';
                                                        return (
                                                            <option key={user.id} value={user.id}>
                                                                {user.name} ({user.email}) - {roleLabel}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                                                    User will be assigned to this project with their system role
                                                </p>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isAddingMember || !newMemberUserId}
                                                className="w-full px-4 py-2 bg-[var(--color-accent)] text-white rounded-md hover:opacity-90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isAddingMember && <Loader2 size={16} className="animate-spin" />}
                                                {isAddingMember ? 'Adding...' : 'Add Member'}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetailPage;
