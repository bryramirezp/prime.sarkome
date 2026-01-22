import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import type { LayoutContext } from '../components/Layout';
import ProjectViewer from '../components/ProjectViewer';
import ExportMenu from '../components/ExportMenu';

/**
 * Projects Page - Standalone view for managing research projects
 */
export default function ProjectsPage() {
    const { darkMode, projectsHook } = useOutletContext<LayoutContext>();
    const navigate = useNavigate();

    const handleExploreNode = (nodeName: string) => {
        // Navigate to chat and trigger exploration
        navigate('/chat');
        // Note: We'd need to pass this through context or state management
        // For now, user can manually search
    };

    if (!projectsHook) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className={`text-center ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    <p>Projects not available</p>
                </div>
            </div>
        );
    }

    const { currentProject, currentProjectId } = projectsHook;

    return (
        <div className="flex flex-col h-full">
            {currentProject ? (
                <>
                    {/* Header with Export */}
                    <div className={`border-b px-6 py-4 flex items-center justify-between ${darkMode ? 'border-zinc-800 bg-zinc-950/50' : 'border-slate-200 bg-white/50'}`}>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => projectsHook.setCurrentProjectId(null)}
                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-zinc-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
                                title="Back to projects"
                            >
                                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                            </button>
                            <div>
                                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {currentProject.name}
                                </h1>
                                {currentProject.description && (
                                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                        {currentProject.description}
                                    </p>
                                )}
                            </div>
                        </div>
                        <ExportMenu project={currentProject} darkMode={darkMode} />
                    </div>

                    {/* Project Content */}
                    <div className="flex-1 overflow-hidden">
                        <ProjectViewer
                            project={currentProject}
                            onRemoveItem={(itemId) =>
                                projectsHook.removeItemFromProject(currentProjectId!, itemId)
                            }
                            onUpdateNotes={(itemId, notes) =>
                                projectsHook.updateItemNotes(currentProjectId!, itemId, notes)
                            }
                            onUpdateTags={(itemId, tags) =>
                                projectsHook.updateItemTags(currentProjectId!, itemId, tags)
                            }
                            onExploreNode={handleExploreNode}
                            darkMode={darkMode}
                        />
                    </div>
                </>
            ) : (
                /* No Project Selected */
                <div className="flex flex-col items-center justify-center h-full p-8">
                    <span className="material-symbols-outlined text-6xl mb-4 opacity-50">folder_open</span>
                    <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        No Project Selected
                    </h2>
                    <p className={`text-sm text-center max-w-md mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Select a project from the sidebar to view its contents, or create a new project to start organizing your research.
                    </p>
                    <button
                        onClick={() => {
                            // This would ideally trigger the sidebar to open Projects tab
                            // For now, just show a message
                        }}
                        className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/80 transition-colors"
                    >
                        Open Sidebar
                    </button>
                </div>
            )}
        </div>
    );
}
