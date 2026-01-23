import React, { useState } from 'react';
import { Project, SavedItem } from '../schemas/projectSchema';

interface ProjectViewerProps {
    project: Project;
    onRemoveItem: (itemId: string) => void;
    onUpdateNotes: (itemId: string, notes: string) => void;
    onUpdateTags: (itemId: string, tags: string[]) => void;
    onExploreNode: (nodeName: string) => void;
    darkMode?: boolean;
}

/**
 * Project Viewer - Displays items within a research project
 */
const ProjectViewer: React.FC<ProjectViewerProps> = ({
    project,
    onRemoveItem,
    onUpdateNotes,
    onUpdateTags,
    onExploreNode,
    darkMode = false,
}) => {
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
    const [notesText, setNotesText] = useState('');

    const getItemIcon = (type: SavedItem['type']) => {
        switch (type) {
            case 'entity': return '🧬';
            case 'path': return '🛤️';
            case 'hypothesis': return '💡';
            case 'message': return '💬';
            case 'graph': return '🕸️';
            default: return '📄';
        }
    };

    const getItemTypeLabel = (type: SavedItem['type']) => {
        switch (type) {
            case 'entity': return 'Entity';
            case 'path': return 'Path';
            case 'hypothesis': return 'Hypothesis';
            case 'message': return 'Message';
            case 'graph': return 'Graph';
            default: return 'Item';
        }
    };

    const startEditingNotes = (item: SavedItem) => {
        setEditingNotesId(item.id);
        setNotesText(item.notes || '');
    };

    const saveNotes = (itemId: string) => {
        onUpdateNotes(itemId, notesText);
        setEditingNotesId(null);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };

    if (project.items.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center h-full p-8 text-tertiary`}>
                <span className="material-symbols-outlined text-5xl mb-4 opacity-50">folder_open</span>
                <p className="text-sm font-medium mb-1">No items in this project yet</p>
                <p className="text-xs text-center max-w-xs">
                    Save entities, hypotheses, or messages from the chat to build your research collection
                </p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-4">
            {/* Project Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: project.color }}
                    />
                    <h2 className={`text-xl font-bold text-primary`}>
                        {project.name}
                    </h2>
                </div>
                {project.description && (
                    <p className={`text-sm text-secondary`}>
                        {project.description}
                    </p>
                )}
                <div className={`text-xs mt-2 text-tertiary`}>
                    {project.items.length} item{project.items.length !== 1 ? 's' : ''} • Updated {formatDate(project.updatedAt)}
                </div>
            </div>

            {/* Items List */}
            <div className="space-y-3">
                {project.items.map((item) => {
                    const isExpanded = expandedItemId === item.id;
                    const isEditingNotes = editingNotesId === item.id;

                    return (
                        <div
                            key={item.id}
                            className={`
                border rounded-xl p-4 transition-all
                ${darkMode ? 'bg-surface/50 border-border hover:border-border' : 'bg-white border-border hover:border-border'}
              `}
                        >
                            {/* Item Header */}
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <span className="text-2xl flex-shrink-0">{getItemIcon(item.type)}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <button
                                                onClick={() => {
                                                    if (item.type === 'entity') {
                                                        onExploreNode(item.name);
                                                    }
                                                }}
                                                className={`
                          font-semibold text-sm truncate hover:underline
                          text-accent
                          ${item.type !== 'entity' ? 'cursor-default hover:no-underline' : ''}
                        `}
                                            >
                                                {item.name}
                                            </button>
                                            <span className={`
                        text-xs px-2 py-0.5 rounded-full
                        bg-surface-hover text-tertiary
                      `}>
                                                {getItemTypeLabel(item.type)}
                                            </span>
                                        </div>
                                        <div className={`text-xs text-tertiary`}>
                                            Saved {formatDate(item.timestamp)}
                                        </div>

                                        {/* Tags */}
                                        {item.tags && item.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {item.tags.map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className={`
                              text-xs px-2 py-0.5 rounded-full
                              bg-accent/20 text-accent
                            `}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                        className={`
                      p-1 rounded hover:bg-surface-hover
                      text-secondary
                    `}
                                        title={isExpanded ? 'Collapse' : 'Expand'}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            {isExpanded ? 'expand_less' : 'expand_more'}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Remove this item from the project?')) {
                                                onRemoveItem(item.id);
                                            }
                                        }}
                                        className="p-1 rounded hover:bg-red-500/20 text-red-500"
                                        title="Remove"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className={`
                  mt-3 pt-3 border-t space-y-3
                  border-border
                `}>
                                    {/* Notes Section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className={`text-xs font-medium text-secondary`}>
                                                Notes
                                            </label>
                                            {!isEditingNotes && (
                                                <button
                                                    onClick={() => startEditingNotes(item)}
                                                    className={`text-xs text-accent hover:underline`}
                                                >
                                                    {item.notes ? 'Edit' : 'Add notes'}
                                                </button>
                                            )}
                                        </div>

                                        {isEditingNotes ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={notesText}
                                                    onChange={(e) => setNotesText(e.target.value)}
                                                    placeholder="Add your research notes here..."
                                                    rows={3}
                                                    className={`
                            w-full px-3 py-2 rounded-lg border text-sm resize-none
                            ${darkMode
                                                            ? 'bg-surface border-border text-primary placeholder-tertiary'
                                                            : 'bg-white border-border text-primary placeholder-tertiary'
                                                        }
                          `}
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => saveNotes(item.id)}
                                                        className="px-3 py-1 text-xs rounded bg-accent text-white hover:bg-accent/80"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingNotesId(null)}
                                                        className={`px-3 py-1 text-xs rounded bg-surface text-secondary`}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : item.notes ? (
                                            <p className={`text-sm text-secondary`}>
                                                {item.notes}
                                            </p>
                                        ) : (
                                            <p className={`text-sm italic text-tertiary`}>
                                                No notes yet
                                            </p>
                                        )}
                                    </div>

                                    {/* Data Preview */}
                                    {item.data && (
                                        <div>
                                            <label className={`text-xs font-medium mb-2 block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                Data
                                            </label>
                                            <details className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                <summary className="cursor-pointer hover:underline">View raw data</summary>
                                                <pre className={`
                          mt-2 p-2 rounded overflow-auto max-h-40
                          ${darkMode ? 'bg-black/50' : 'bg-slate-100'}
                        `}>
                                                    {JSON.stringify(item.data, null, 2)}
                                                </pre>
                                            </details>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProjectViewer;
