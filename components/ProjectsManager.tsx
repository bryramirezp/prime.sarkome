import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../schemas/projectSchema';

interface ProjectsManagerProps {
    projects: Project[];
    currentProjectId: string | null;
    onSelectProject: (projectId: string | null) => void;
    onCreateProject: (name: string, description?: string, color?: string) => void;
    onDeleteProject: (projectId: string) => void;
    onRenameProject: (projectId: string, newName: string) => void;
    onToggleStar: (projectId: string) => void;
    darkMode?: boolean;
}

const PROJECT_COLORS = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Green', value: '#10b981' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Blue', value: '#3b82f6' },
];

/**
 * Projects Manager - Sidebar component for managing research collections
 */
const ProjectsManager: React.FC<ProjectsManagerProps> = ({
    projects,
    currentProjectId,
    onSelectProject,
    onCreateProject,
    onDeleteProject,
    onRenameProject,
    onToggleStar,
    darkMode = false,
}) => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');
    const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0].value);
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const handleCreate = () => {
        if (!newProjectName.trim()) return;

        onCreateProject(newProjectName, newProjectDescription, newProjectColor);
        setNewProjectName('');
        setNewProjectDescription('');
        setNewProjectColor(PROJECT_COLORS[0].value);
        setShowCreateModal(false);
    };

    const handleRename = (projectId: string) => {
        if (!editingName.trim()) return;
        onRenameProject(projectId, editingName);
        setEditingProjectId(null);
        setEditingName('');
    };

    const startEditing = (project: Project) => {
        setEditingProjectId(project.id);
        setEditingName(project.name);
    };

    // Sort: starred first, then by updated date
    const sortedProjects = [...projects].sort((a, b) => {
        if (a.starred && !b.starred) return -1;
        if (!a.starred && b.starred) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return (
        <div className={`flex flex-col h-full ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                    <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Research Projects
                    </h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-8 h-8 rounded-lg bg-accent hover:bg-accent/80 text-white flex items-center justify-center transition-colors"
                        title="Create new project"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                    </button>
                </div>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Organize your discoveries into collections
                </p>

                {/* View Details Button - shown when project is selected */}
                {currentProjectId && (
                    <Link
                        to="/projects"
                        className={`
                            mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
                            transition-colors
                            ${darkMode
                                ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            }
                        `}
                    >
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        View Full Details
                    </Link>
                )}
            </div>

            {/* Projects List */}
            <div className="flex-1 overflow-y-auto p-2">
                {/* "All Items" option */}
                <button
                    onClick={() => onSelectProject(null)}
                    className={`
            w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors
            ${currentProjectId === null
                            ? darkMode
                                ? 'bg-indigo-500/20 text-indigo-400'
                                : 'bg-indigo-100 text-indigo-700'
                            : darkMode
                                ? 'hover:bg-zinc-800 text-slate-300'
                                : 'hover:bg-slate-100 text-slate-700'
                        }
          `}
                >
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">inbox</span>
                        <span className="text-sm font-medium">All Items</span>
                    </div>
                </button>

                {sortedProjects.length === 0 ? (
                    <div className={`text-center py-8 px-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        <span className="material-symbols-outlined text-3xl mb-2 opacity-50">folder_off</span>
                        <p className="text-xs">No projects yet</p>
                        <p className="text-xs mt-1">Create one to start organizing</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {sortedProjects.map((project) => (
                            <div
                                key={project.id}
                                className={`
                  group rounded-lg transition-all
                  ${currentProjectId === project.id
                                        ? darkMode
                                            ? 'bg-zinc-800'
                                            : 'bg-slate-100'
                                        : darkMode
                                            ? 'hover:bg-zinc-800/50'
                                            : 'hover:bg-slate-50'
                                    }
                `}
                            >
                                {editingProjectId === project.id ? (
                                    <div className="p-2">
                                        <input
                                            type="text"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRename(project.id);
                                                if (e.key === 'Escape') setEditingProjectId(null);
                                            }}
                                            onBlur={() => handleRename(project.id)}
                                            className={`
                        w-full px-2 py-1 text-sm rounded border
                        ${darkMode
                                                    ? 'bg-zinc-900 border-zinc-700 text-white'
                                                    : 'bg-white border-slate-300 text-slate-900'
                                                }
                      `}
                                            autoFocus
                                        />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => onSelectProject(project.id)}
                                        className="w-full text-left px-3 py-2"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: project.color }}
                                            />
                                            <span className={`text-sm font-medium flex-1 truncate ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                                {project.name}
                                            </span>
                                            {project.starred && (
                                                <span className="material-symbols-outlined text-[14px] text-amber-500">star</span>
                                            )}
                                            <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                                {project.items.length}
                                            </span>
                                        </div>
                                        {project.description && (
                                            <p className={`text-xs mt-1 truncate ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                {project.description}
                                            </p>
                                        )}
                                    </button>
                                )}

                                {/* Action buttons (visible on hover) */}
                                <div className="flex items-center gap-1 px-2 pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleStar(project.id);
                                        }}
                                        className={`p-1 rounded hover:bg-surface-hover ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}
                                        title={project.starred ? 'Unstar' : 'Star'}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">
                                            {project.starred ? 'star' : 'star_outline'}
                                        </span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            startEditing(project);
                                        }}
                                        className={`p-1 rounded hover:bg-surface-hover ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}
                                        title="Rename"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Delete project "${project.name}"? This cannot be undone.`)) {
                                                onDeleteProject(project.id);
                                            }
                                        }}
                                        className="p-1 rounded hover:bg-red-500/20 text-red-500"
                                        title="Delete"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className={`max-w-md w-full rounded-2xl p-6 ${darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white shadow-xl'}`}>
                        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            Create New Project
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className={`text-sm font-medium mb-1 block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    Project Name *
                                </label>
                                <input
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="e.g., EGFR Inhibitors Research"
                                    className={`
                    w-full px-3 py-2 rounded-lg border text-sm
                    ${darkMode
                                            ? 'bg-zinc-800 border-zinc-700 text-white placeholder-slate-500'
                                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                                        }
                  `}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className={`text-sm font-medium mb-1 block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    Description (optional)
                                </label>
                                <textarea
                                    value={newProjectDescription}
                                    onChange={(e) => setNewProjectDescription(e.target.value)}
                                    placeholder="Brief description of this research project..."
                                    rows={2}
                                    className={`
                    w-full px-3 py-2 rounded-lg border text-sm resize-none
                    ${darkMode
                                            ? 'bg-zinc-800 border-zinc-700 text-white placeholder-slate-500'
                                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                                        }
                  `}
                                />
                            </div>

                            <div>
                                <label className={`text-sm font-medium mb-2 block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    Color
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {PROJECT_COLORS.map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={() => setNewProjectColor(color.value)}
                                            className={`
                        w-8 h-8 rounded-full transition-all
                        ${newProjectColor === color.value ? 'ring-2 ring-offset-2 ring-offset-background' : ''}
                      `}
                                            style={{
                                                backgroundColor: color.value
                                            }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewProjectName('');
                                    setNewProjectDescription('');
                                }}
                                className={`
                  flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${darkMode
                                        ? 'bg-zinc-800 text-slate-300 hover:bg-zinc-700'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }
                `}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!newProjectName.trim()}
                                className="
                  flex-1 px-4 py-2 rounded-lg text-sm font-medium
                  bg-accent hover:bg-accent/80 text-white
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
                            >
                                Create Project
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectsManager;
