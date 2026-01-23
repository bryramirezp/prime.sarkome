import React from 'react';

/**
 * Maps tool calls to user-friendly labels and icons.
 */
interface ToolStatus {
    icon: string;
    label: string;
    color: string;
}

const TOOL_STATUS_MAP: Record<string, ToolStatus> = {
    searchSemantic: {
        icon: '🔍',
        label: 'Searching 129K entities...',
        color: 'from-cyan-500 to-blue-500'
    },
    searchText: {
        icon: '📝',
        label: 'Text search...',
        color: 'from-slate-500 to-zinc-500'
    },
    getNeighbors: {
        icon: '🔗',
        label: 'Finding connections...',
        color: 'from-emerald-500 to-green-500'
    },
    getSubgraph: {
        icon: '🕸️',
        label: 'Building network graph...',
        color: 'from-violet-500 to-purple-500'
    },
    getShortestPath: {
        icon: '🛤️',
        label: 'Calculating path...',
        color: 'from-amber-500 to-orange-500'
    },
    getDrugRepurposing: {
        icon: '💊',
        label: 'Generating hypotheses...',
        color: 'from-pink-500 to-rose-500'
    },
    getTherapeuticTargets: {
        icon: '🎯',
        label: 'Identifying targets...',
        color: 'from-red-500 to-rose-500'
    },
    getDrugCombinations: {
        icon: '⚗️',
        label: 'Finding synergies...',
        color: 'from-indigo-500 to-violet-500'
    },
    getMechanism: {
        icon: '🧬',
        label: 'Tracing mechanism...',
        color: 'from-teal-500 to-cyan-500'
    },
    checkHealth: {
        icon: '❤️',
        label: 'Checking API status...',
        color: 'from-green-500 to-emerald-500'
    },
    getGraphStats: {
        icon: '📊',
        label: 'Fetching statistics...',
        color: 'from-blue-500 to-indigo-500'
    }
};

interface ToolExecutionChipsProps {
    traceEntries: string[];
    darkMode?: boolean;
}

/**
 * Parses trace log entries to extract active tools.
 */
const parseActiveTools = (traces: string[]): string[] => {
    const activeTools: string[] = [];

    for (const entry of traces) {
        // Match patterns like "Calling tool: getNeighbors"
        const callMatch = entry.match(/Calling tool:\s*(\w+)/i);
        if (callMatch) {
            const toolName = callMatch[1];
            if (!activeTools.includes(toolName)) {
                activeTools.push(toolName);
            }
        }

        // Remove tool when it completes
        const doneMatch = entry.match(/Tool result received:\s*(\w+)/i);
        if (doneMatch) {
            const toolName = doneMatch[1];
            const index = activeTools.indexOf(toolName);
            if (index > -1) {
                activeTools.splice(index, 1);
            }
        }
    }

    return activeTools;
};

/**
 * Animated chips showing currently executing tools.
 * Provides visual feedback during AI processing.
 */
const ToolExecutionChips: React.FC<ToolExecutionChipsProps> = ({
    traceEntries,
    darkMode = false
}) => {
    const activeTools = parseActiveTools(traceEntries);

    // Also check if we're in initial processing (Model detected)
    const isProcessing = traceEntries.some(e => e.includes('Model:'));
    const hasActiveTools = activeTools.length > 0;

    if (!isProcessing && !hasActiveTools) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2 items-center justify-center py-3">
            {/* Initial thinking indicator */}
            {isProcessing && !hasActiveTools && (
                <div className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
          animate-pulse
          bg-surface border border-border text-secondary
                    }
        `}>
                    <span className="animate-spin">🧠</span>
                    <span>Analyzing your question...</span>
                </div>
            )}

            {/* Active tool chips */}
            {activeTools.map((toolName) => {
                const status = TOOL_STATUS_MAP[toolName] || {
                    icon: '⚙️',
                    label: `Running ${toolName}...`,
                    color: 'from-slate-500 to-zinc-500'
                };

                return (
                    <div
                        key={toolName}
                        className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
              text-white shadow-lg
              animate-pulse
              bg-gradient-to-r ${status.color}
            `}
                    >
                        <span className="text-base">{status.icon}</span>
                        <span>{status.label}</span>
                        <span className="flex gap-0.5">
                            <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default ToolExecutionChips;
