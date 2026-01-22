import React, { useState } from 'react';
import { Project, SavedItem } from '../schemas/projectSchema';

interface SaveToProjectButtonProps {
    itemType: SavedItem['type'];
    itemName: string;
    itemData: any;
    projects: Project[];
    onSaveToProject: (projectId: string, type: SavedItem['type'], name: string, data: any, notes?: string, tags?: string[]) => void;
    onCreateProject: (name: string) => string;
    darkMode?: boolean;
}

/**
 * Button to save an item (entity, hypothesis, message, etc.) to a project.
 * Shows a dropdown menu to select the target project.
 */
const SaveToProjectButton: React.FC<SaveToProjectButtonProps> = ({
    itemType,
    itemName,
    itemData,
    projects,
    onSaveToProject,
    onCreateProject,
    darkMode = false,
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [saved, setSaved] = useState(false);

    const handleSave = (projectId: string) => {
        onSaveToProject(projectId, itemType, itemName, itemData);
        setSaved(true);
        setShowMenu(false);

        // Reset saved state after animation
        setTimeout(() => setSaved(false), 2000);
    };

    const handleCreateAndSave = () => {
        if (!newProjectName.trim()) return;

        const projectId = onCreateProject(newProjectName);
        handleSave(projectId);
        setNewProjectName('');
        setShowCreateInput(false);
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className={`
          inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
          transition-all
          ${saved
                        ? 'bg-emerald-500/20 text-emerald-500'
                        : darkMode
                            ? 'bg-zinc-800 text-slate-400 hover:bg-zinc-700 hover:text-slate-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-700'
                    }
        `}
                title="Save to project"
            >
                <span className="material-symbols-outlined text-[14px]">
                    {saved ? 'check' : 'bookmark_add'}
                </span>
                <span>{saved ? 'Saved' : 'Save'}</span>
            </button>

            {showMenu && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => {
                            setShowMenu(false);
                            setShowCreateInput(false);
                        }}
                    />

                    {/* Dropdown Menu */}
                    <div className={`
            absolute right-0 mt-1 w-64 rounded-lg shadow-lg border z-50
            ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}
          `}>
                        <div className="p-2 max-h-64 overflow-y-auto">
                            {/* Header */}
                            <div className={`px-2 py-1 text-xs font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Save to project
                            </div>

                            {/* Projects List */}
                            {projects.length === 0 ? (
                                <div className={`px-2 py-3 text-xs text-center ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    No projects yet
                                </div>
                            ) : (
                                <div className="space-y-1 mb-2">
                                    {projects.map((project) => (
                                        <button
                                            key={project.id}
                                            onClick={() => handleSave(project.id)}
                                            className={`
                        w-full text-left px-2 py-1.5 rounded text-sm
                        flex items-center gap-2
                        ${darkMode
                                                    ? 'hover:bg-zinc-800 text-slate-300'
                                                    : 'hover:bg-slate-100 text-slate-700'
                                                }
                      `}
                                        >
                                            <div
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: project.color }}
                                            />
                                            <span className="flex-1 truncate">{project.name}</span>
                                            <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                                {project.items.length}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Create New Project */}
                            <div className={`border-t pt-2 ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
                                {showCreateInput ? (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={newProjectName}
                                            onChange={(e) => setNewProjectName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleCreateAndSave();
                                                if (e.key === 'Escape') setShowCreateInput(false);
                                            }}
                                            placeholder="Project name..."
                                            className={`
                        w-full px-2 py-1.5 text-sm rounded border
                        ${darkMode
                                                    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-slate-500'
                                                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                                                }
                      `}
                                            autoFocus
                                        />
                                        <div className="flex gap-1">
                                            <button
                                                onClick={handleCreateAndSave}
                                                disabled={!newProjectName.trim()}
                                                className="
                          flex-1 px-2 py-1 text-xs rounded
                          bg-accent text-white hover:bg-accent/80
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                                            >
                                                Create & Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowCreateInput(false);
                                                    setNewProjectName('');
                                                }}
                                                className={`
                          px-2 py-1 text-xs rounded
                          ${darkMode ? 'bg-zinc-800 text-slate-400' : 'bg-slate-100 text-slate-600'}
                        `}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowCreateInput(true)}
                                        className={`
                      w-full text-left px-2 py-1.5 rounded text-sm
                      flex items-center gap-2
                      ${darkMode
                                                ? 'hover:bg-zinc-800 text-cyan-400'
                                                : 'hover:bg-slate-100 text-cyan-600'
                                            }
                    `}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">add</span>
                                        <span>Create new project</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SaveToProjectButton;
