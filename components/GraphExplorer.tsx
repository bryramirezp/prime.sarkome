import React, { useState, useCallback } from 'react';
import { kgService } from '../services/kgService';
import GraphVisualization from './GraphVisualization';
import { GraphData } from '../types';


interface GraphExplorerProps {
    darkMode: boolean;
}

const GraphExplorer: React.FC<GraphExplorerProps> = ({ darkMode }) => {
    const [entity, setEntity] = useState('');
    const [hops, setHops] = useState(1);
    const [limit, setLimit] = useState(50);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [lastQuery, setLastQuery] = useState<string>('');

    const handleVisualize = useCallback(async () => {
        if (!entity.trim()) {
            setError('Please enter an entity name');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await kgService.getSubgraph(entity.trim(), hops, limit);

            if (!data.nodes || data.nodes.length === 0) {
                setError(`No data found for "${entity}". Try a different entity name.`);
                setGraphData(null);
                return;
            }

            // Transform nodes to use 'name' as ID (since edges reference by name)
            const nodes = data.nodes.map((n: any) => ({
                id: n.name || n.id || n.db_id,
                name: n.name || n.node_name || n.id,
                type: n.type || n.node_type || 'unknown'
            }));

            const edges = (data.edges || []).map((e: any) => ({
                source: e.source,
                target: e.target,
                relation: e.relation || e.display_relation || ''
            }));

            setGraphData({ nodes, edges });
            setLastQuery(entity.trim());
        } catch (err) {
            console.error('Graph fetch error:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch graph data');
            setGraphData(null);
        } finally {
            setIsLoading(false);
        }
    }, [entity, hops, limit]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleVisualize();
        }
    };

    return (
        <div className={`flex-1 flex flex-col h-full overflow-hidden ${darkMode ? 'bg-zinc-950' : 'bg-white'}`}>

            {/* Controls Panel */}
            <div className={`p-6 border-b ${darkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="max-w-4xl mx-auto">
                    <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Explore Knowledge Graph
                    </h2>
                    <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Enter an entity name (disease, drug, gene, protein) to visualize its neighborhood in PrimeKG.
                    </p>

                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Entity Input */}
                        <div className="flex-1">
                            <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Entity Name
                            </label>
                            <input
                                type="text"
                                value={entity}
                                onChange={(e) => setEntity(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="e.g., TP53, Alzheimer disease, Aspirin..."
                                className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${darkMode
                                    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                                    }`}
                            />
                        </div>

                        {/* Hops Selector */}
                        <div className="w-full md:w-32">
                            <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Hops (depth)
                            </label>
                            <select
                                value={hops}
                                onChange={(e) => setHops(Number(e.target.value))}
                                className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${darkMode
                                    ? 'bg-zinc-800 border-zinc-700 text-white'
                                    : 'bg-white border-slate-300 text-slate-900'
                                    }`}
                            >
                                <option value={1}>1 hop</option>
                                <option value={2}>2 hops</option>
                                <option value={3}>3 hops</option>
                            </select>
                        </div>

                        {/* Limit Selector */}
                        <div className="w-full md:w-32">
                            <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Max Nodes
                            </label>
                            <select
                                value={limit}
                                onChange={(e) => setLimit(Number(e.target.value))}
                                className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${darkMode
                                    ? 'bg-zinc-800 border-zinc-700 text-white'
                                    : 'bg-white border-slate-300 text-slate-900'
                                    }`}
                            >
                                <option value={25}>25 nodes</option>
                                <option value={50}>50 nodes</option>
                                <option value={100}>100 nodes</option>
                            </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-end gap-2">
                            <button
                                onClick={() => {
                                    setEntity('');
                                    setHops(1);
                                    setLimit(50);
                                    setError(null);
                                    setGraphData(null);
                                    setLastQuery('');
                                }}
                                className={`px-4 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-2 border ${darkMode
                                    ? 'border-zinc-700 text-slate-300 hover:bg-zinc-800 hover:text-white'
                                    : 'border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                title="Clear Search"
                            >
                                <span className="material-symbols-outlined text-[18px]">backspace</span>
                                <span className="hidden sm:inline">Clear</span>
                            </button>

                            <button
                                onClick={handleVisualize}
                                disabled={isLoading || !entity.trim()}
                                className={`px-6 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${isLoading || !entity.trim()
                                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-lg hover:shadow-indigo-500/25'
                                    }`}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                        <span>Loading...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">hub</span>
                                        <span>Visualize</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className={`mt-4 p-3 rounded-lg text-sm ${darkMode ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {/* Graph Visualization Area */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="max-w-6xl mx-auto h-full">
                    {graphData ? (
                        <div className="h-full flex flex-col">
                            <div className={`mb-4 flex items-center justify-between ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                <h3 className="font-semibold">
                                    Subgraph for: <span className="text-indigo-500">{lastQuery}</span>
                                </h3>
                                <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    {graphData.nodes.length} nodes, {graphData.edges.length} edges
                                </span>
                            </div>
                            <div className="flex-1 min-h-[500px]">
                                <GraphVisualization
                                    data={graphData}
                                    darkMode={darkMode}
                                    height={600}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className={`h-full flex flex-col items-center justify-center ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            <span className="material-symbols-outlined text-[64px] mb-4 opacity-50">hub</span>
                            <p className="text-lg font-medium mb-2">No graph loaded</p>
                            <p className="text-sm">Enter an entity name and click "Visualize" to explore the knowledge graph</p>
                            <div className="mt-6 flex flex-wrap gap-2 justify-center">
                                {['TP53', 'BRCA1', 'Alzheimer disease', 'Aspirin', 'Diabetes'].map(example => (
                                    <button
                                        key={example}
                                        onClick={() => setEntity(example)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${darkMode
                                            ? 'bg-zinc-800 hover:bg-zinc-700 text-slate-300'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                            }`}
                                    >
                                        {example}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export default GraphExplorer;

