import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Bell, Search, HelpCircle, X } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';

const Header: React.FC = () => {
    const location = useLocation();
    const { projects } = useProjectStore();
    const [showHelpModal, setShowHelpModal] = useState(false);

    // Generate breadcrumbs from current path with intelligent name lookup
    const generateBreadcrumbs = () => {
        const paths = location.pathname.split('/').filter(Boolean);
        const breadcrumbs = [{ label: 'Home', path: '/' }];

        paths.forEach((path, index) => {
            const fullPath = '/' + paths.slice(0, index + 1).join('/');
            let label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');

            // Check if this looks like a UUID (project or page ID)
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(path);

            if (isUUID) {
                // Look up project name
                const project = projects.find(p => p.id === path);
                if (project) {
                    label = project.name;
                } else {
                    // Look up page name
                    for (const proj of projects) {
                        const page = proj.pages.find(pg => pg.id === path);
                        if (page) {
                            label = page.name;
                            break;
                        }
                    }
                }
            }

            breadcrumbs.push({
                label,
                path: fullPath,
            });
        });

        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();

    return (
        <>
            <header className="bg-bg-secondary border-b border-border px-6 h-14 flex items-center">
                <div className="flex items-center justify-between w-full">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm">
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={crumb.path}>
                                {index > 0 && <ChevronRight size={16} className="text-text-tertiary" />}
                                <Link
                                    to={crumb.path}
                                    className={`${index === breadcrumbs.length - 1
                                        ? 'text-text-primary font-medium'
                                        : 'text-text-secondary hover:text-text-primary'
                                        } transition-smooth`}
                                >
                                    {crumb.label}
                                </Link>
                            </React.Fragment>
                        ))}
                    </nav>

                    {/* Right Section */}
                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                            />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2 bg-bg-tertiary border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-smooth"
                            />
                        </div>

                        {/* Help Button */}
                        <button
                            onClick={() => setShowHelpModal(true)}
                            className="p-2 hover:bg-bg-tertiary rounded-md transition-smooth"
                            title="Help & Guide"
                        >
                            <HelpCircle size={20} className="text-text-secondary" />
                        </button>

                        {/* Notifications */}
                        <button className="relative p-2 hover:bg-bg-tertiary rounded-md transition-smooth">
                            <Bell size={20} className="text-text-secondary" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
                        </button>

                        {/* User Dropdown - Placeholder */}
                        <div className="w-8 h-8 bg-accent rounded-full"></div>
                    </div>
                </div>
            </header>

            {/* Help Modal */}
            {showHelpModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-xl font-semibold">How to Use Content Verify</h2>
                            <button
                                onClick={() => setShowHelpModal(false)}
                                className="p-1 hover:bg-gray-100 rounded-md"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* App Overview */}
                            <section>
                                <h3 className="text-lg font-semibold text-blue-600 mb-2">📋 Overview</h3>
                                <p className="text-gray-600">
                                    Content Verify is a collaborative content management and SEO optimization tool.
                                    It helps teams create, review, and approve website content with built-in SEO analysis.
                                </p>
                            </section>

                            {/* Workflow */}
                            <section>
                                <h3 className="text-lg font-semibold text-blue-600 mb-2">🔄 Workflow</h3>
                                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                                    <li><strong>Create Project</strong> - Admin/Manager creates a project for a website</li>
                                    <li><strong>Add Pages</strong> - Define pages that need content</li>
                                    <li><strong>SEO Keywords</strong> - SEO Analyst adds primary & secondary keywords</li>
                                    <li><strong>Write Content</strong> - Content Writer creates content using keywords</li>
                                    <li><strong>Review & Approve</strong> - Content Verifier reviews and approves content</li>
                                </ol>
                            </section>

                            {/* Who to Contact */}
                            <section>
                                <h3 className="text-lg font-semibold text-blue-600 mb-3">👥 Who to Contact</h3>
                                <div className="grid gap-3">
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <p className="font-medium text-blue-800">🔍 SEO Analyst</p>
                                        <p className="text-sm text-blue-600">For SEO keywords, keyword research, and optimization queries</p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                        <p className="font-medium text-green-800">✍️ Content Writer</p>
                                        <p className="text-sm text-green-600">For content creation, updates, and copy-related questions</p>
                                    </div>
                                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                                        <p className="font-medium text-purple-800">✅ Content Verifier</p>
                                        <p className="text-sm text-purple-600">For content review, approval status, and revision requests</p>
                                    </div>
                                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                        <p className="font-medium text-orange-800">⚙️ Admin</p>
                                        <p className="text-sm text-orange-600">For project setup, team access, and technical issues</p>
                                    </div>
                                </div>
                            </section>

                            {/* Keyword Tooltip Info */}
                            <section>
                                <h3 className="text-lg font-semibold text-blue-600 mb-2">💡 Tips</h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-600">
                                    <li>Hover over keywords to see SEO metrics (volume, CPC, competition)</li>
                                    <li>Content Verifiers can see keyword highlighting in content</li>
                                    <li>Track progress with status badges on each page</li>
                                    <li>Use the analysis scores to improve content quality</li>
                                </ul>
                            </section>
                        </div>

                        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
                            <button
                                onClick={() => setShowHelpModal(false)}
                                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Got it!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
