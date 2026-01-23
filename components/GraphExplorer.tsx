import React, { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-hot-toast';
import { kgService } from '../services/kgService';
import GraphVisualization from './GraphVisualization';
import { GraphData, GeminiModel } from '../types';
import { generateResponse } from '../services/geminiService';
import { useApiKey } from '../contexts/ApiKeyContext';

interface GraphExplorerProps {
    darkMode: boolean;
}

const GraphExplorer: React.FC<GraphExplorerProps> = ({ darkMode }) => {
    const { apiKey } = useApiKey();
    const [entity, setEntity] = useState('');
    const [hops, setHops] = useState(1);
    const [limit, setLimit] = useState(50);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [lastQuery, setLastQuery] = useState<string>('');
    
    // Inspector State
    const [selectedNode, setSelectedNode] = useState<any | null>(null);
    const [analysisCache, setAnalysisCache] = useState<Record<string, string>>({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Quick Coordinates State
    const [quickCoordinates, setQuickCoordinates] = useState<string[]>(['Pembrolizumab', 'PCSK9', 'CRISPR', 'Semaglutide']);
    const [isGeneratingCoords, setIsGeneratingCoords] = useState(false);

    const generateCoordinates = async () => {
        setIsGeneratingCoords(true);
        try {
            const prompt = `Generate 4 distinct, interesting biomedical entities (Gene, Drug, or Disease) relevant to precision medicine in 2026. 
            Return ONLY a raw JSON array of strings, e.g. ["Entity1", "Entity2", ...]. Do not use code blocks.`;
            
            const response = await generateResponse(prompt, [], GeminiModel.FLASH_2_0_EXP, apiKey || undefined);
            const text = response.text.replace(/```json|```/g, '').trim();
            const newCoords = JSON.parse(text);
            
            if (Array.isArray(newCoords) && newCoords.length > 0) {
                setQuickCoordinates(newCoords.slice(0, 4));
                toast.success("Coordinates Updated", {
                    style: {
                        background: darkMode ? '#18181b' : '#fff',
                        color: darkMode ? '#fff' : '#333',
                        border: '1px solid rgb(var(--color-border))',
                    }
                });
            }
        } catch (err) {
            console.error("Failed to generate coordinates", err);
            toast.error("Failed to fresh coordinates");
        } finally {
            setIsGeneratingCoords(false);
        }
    };

    const handleVisualize = useCallback(async (overrideEntity?: string | React.MouseEvent | React.KeyboardEvent) => {
        // Allow overriding the entity for immediate actions (bypassing state update lag)
        const targetInput = typeof overrideEntity === 'string' ? overrideEntity : entity;

        if (!targetInput.trim()) {
            setError('System Alert: Target entity coordinate missing.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSelectedNode(null); // Clear previous selection on new search
        setAnalysisCache({}); // CLEAR CACHE on new focus session

        try {
            let targetEntity = targetInput.trim();
            let displayQuery = targetEntity;

            // 1. Semantic Interception (only if not an override / exact ID request?)
            // We still do it to ensure we get the best KG match
            try {
                // Determine if direct ID fetch or semantic search is needed
                // For now, always try semantic search to "ground" the user input to a KG node
                const searchResults = await kgService.searchSemantic(targetEntity);
                
                if (searchResults && searchResults.length > 0) {
                    const topMatch = searchResults[0];
                    
                    if (topMatch.name && topMatch.name.toLowerCase() !== targetEntity.toLowerCase()) {
                        toast.success((t) => (
                            <div 
                                onClick={() => toast.dismiss(t.id)}
                                className="flex flex-col gap-1 cursor-pointer"
                                title="Click to dismiss"
                            >
                                <span className="font-bold">Semantic Lock Engaged</span>
                                <span className="text-xs opacity-90">
                                    Targeting <span className="font-mono bg-indigo-500/20 px-1 rounded">{topMatch.name}</span>
                                </span>
                                <span className="text-[10px] text-indigo-400 mt-1 uppercase tracking-tighter font-bold">Auto-focusing result...</span>
                            </div>
                        ), {
                            icon: '🧠',
                            duration: 60000,
                            style: {
                                background: darkMode ? 'rgba(24, 24, 27, 0.9)' : '#fff',
                                color: darkMode ? '#fff' : '#333',
                                border: '1px solid rgb(var(--color-border))',
                                backdropFilter: 'blur(8px)'
                            }
                        });
                    }
                    
                    // Use the canonical name or ID from the KG
                    targetEntity = topMatch.name; 
                    displayQuery = topMatch.name;
                } else {
                     // No semantic match found
                     console.log("No semantic match for", targetEntity);
                }
            } catch (err) {
                console.warn("Semantic search uplook failed, reverting to manual override", err);
                // Proceed with original input
            }

            const data = await kgService.getSubgraph(targetEntity, hops, limit);

            if (!data.nodes || data.nodes.length === 0) {
                // FALLBACK: AI Suggestion if completely lost
                try {
                     const suggestionPrompt = `The user searched for "${entity}" in a biomedical knowledge graph but it was not found. 
                     Suggest 1 alternative official name or related entity that IS likely to be in a graph (e.g. DrugBank, UMLS). 
                     Reply with JUST the name, nothing else.`;
                     
                     const suggestion = await generateResponse(suggestionPrompt, [], GeminiModel.FLASH_2_0_EXP, apiKey || undefined);
                     const suggestedName = suggestion.text.trim().replace(/['"]/g, '');

                     setError(`Signal Lost: "${targetEntity}" not found. Did you mean "${suggestedName}"?`);
                } catch (e) {
                     setError(`Signal Lost: No bio-signatures found for "${targetEntity}".`);
                }
                
                setGraphData(null);
                return;
            }

            // Transform nodes for visualization
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
            setLastQuery(displayQuery);

            // AUTO-SELECT the primary node to "send" the user to the result immediately
            const primaryNode = nodes.find(n => 
                n.name.toLowerCase() === targetEntity.toLowerCase() || 
                n.id.toLowerCase() === targetEntity.toLowerCase()
            );
            if (primaryNode) {
                setSelectedNode(primaryNode);
                // No need to clear cache here as we did it at start
            }
        } catch (err) {
            console.error('Graph fetch error:', err);
            // Parse error for better UX
            const msg = err instanceof Error ? err.message : 'Unknown error';
            if (msg.includes('404')) {
                 setError(`Entity not found in Knowledge Graph. Try a different synonym.`);
            } else {
                 setError(msg);
            }
            setGraphData(null);
        } finally {
            setIsLoading(false);
        }
    }, [entity, hops, limit, darkMode]);

    // Handle Node Click - Open Inspector
    const handleNodeClick = (node: any) => {
        setSelectedNode(node);
        // Do NOT clear analysis cache here, so we can return to it!
    };

    const analyzeNode = async (node: any, context: string = 'general') => {
        setIsAnalyzing(true);
        try {
            let prompt = "";
            
            // GROUNDING: Gather specific connections from the visible graph to prevent hallucinations
            const neighbors = graphData?.edges.filter(e => e.source === node.id || e.target === node.id).map(e => {
                 const otherId = e.source === node.id ? e.target : e.source;
                 // Find the name of the other node for better context
                 const otherNode = graphData.nodes.find(n => n.id === otherId);
                 return `${e.relation} -> ${otherNode?.name || otherId} (${otherNode?.type || 'unknown'})`;
            }).slice(0, 15) || []; // Limit to top 15 to fit in context

            const contextStr = neighbors.length > 0 
                ? `\n\nVERIFIED GRAPH CONNECTIONS (Ground Truth):\n${neighbors.join('\n')}\n\nUse these specific connections to ground your answer.`
                : '';

            // Context-Aware Prompt Engineering
            switch(context) {
                case 'treatments':
                    prompt = `Act as a clinical pharmacologist. List the "Standard of Care" and "Emerging Therapies" for the disease: "${node.name}". Format as a concise bulleted list.${contextStr}`;
                    break;
                case 'genetics':
                    prompt = `Act as a geneticist. Describe the "Genetic Drivers" and "Molecular Mechanisms" associated with: "${node.name}". Focus on mutations and pathways.${contextStr}`;
                    break;
                case 'mechanism':
                    prompt = `Act as a molecular biologist. Explain the exact "Mechanism of Action" (MoA) for the drug: "${node.name}". Identify its primary targets and downstream effects.${contextStr}`;
                    break;
                case 'safety':
                    prompt = `Act as a toxicologist. Summarize the "Safety Profile" and "Key Contraindications" for: "${node.name}". precise and clinical.${contextStr}`;
                    break;
                case 'associations':
                    prompt = `Act as a systems biologist. List the top 3 "Associated Diseases" and "Phenotypes" linked to the gene: "${node.name}". Explain the strength of association.${contextStr}`;
                    break;
                default: // 'general'
                    prompt = `Act as a biomedical expert. Provide a "Nano-Brief" (max 3 sentences) for the entity: "${node.name}" (Type: ${node.type}).
                    Focus on its primary biological function or clinical significance.
                    
                    ${contextStr}
                    
                    Then, list 3 potential "Research Questions" a scientist might ask about its relationship to the specific connected entities listed above.
                    Format clearly in Markdown.`;
            }
            
            const response = await generateResponse(prompt, [], GeminiModel.FLASH_2_0_EXP, apiKey || undefined);
            
            // CACHE STRATEGY: Update the cache with successful result
            setAnalysisCache(prev => ({
                ...prev,
                [node.id]: response.text
            }));
            
        } catch (err) {
            console.error("Analysis failed", err);
            // Don't cache errors permanently
            toast.error("Analysis uplink failed.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleVisualize();
        }
    };

    return (
        <div className={`flex-1 flex flex-col h-full overflow-hidden relative bg-[rgb(var(--color-bg-main))]`}>
            
            {/* Grid Background Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-10" 
                 style={{ 
                    backgroundImage: 'linear-gradient(to right, #4f46e5 1px, transparent 1px), linear-gradient(to bottom, #4f46e5 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                 }} 
            />

            {/* Main Content Container */}
            <div className="flex-1 flex flex-col md:flex-row h-full z-10">
                
                {/* Control Panel (Sidebar style) */}
                <div className={`w-full md:w-80 border-r flex flex-col z-20 shadow-2xl flex-shrink-0 border-border bg-surface/90 backdrop-blur-md`}>
                    <div className="p-6 border-b border-indigo-500/20">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h2 className={`text-xs font-bold uppercase tracking-[0.2em] ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                Network Navigator
                            </h2>
                        </div>
                        <h1 className={`text-xl font-bold text-primary`}>
                            Bio-Cartography
                        </h1>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto space-y-6">
                        {/* Entity Input */}
                        <div className="space-y-2">
                            <label className={`block text-[10px] font-bold uppercase tracking-widest text-tertiary`}>
                                Target Entity Coordinates
                            </label>
                            <div className="relative group">
                                <span className={`absolute left-3 top-3 text-[18px] transition-colors ${darkMode ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-600'}`}>
                                    ©
                                </span>
                                <input
                                    type="text"
                                    value={entity}
                                    onChange={(e) => setEntity(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter Gene, Drug, Disease, or describe a concept..."
                                    className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm font-mono transition-all outline-none focus:ring-2 focus:ring-indigo-500/50 bg-[rgb(var(--color-input-bg))] border-[rgb(var(--color-input-border))] text-primary placeholder-tertiary shadow-inner`}
                                />
                            </div>
                        </div>

                        {/* Sliders / Selectors */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className={`block text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Scan Depth
                                </label>
                                <select
                                    value={hops}
                                    onChange={(e) => setHops(Number(e.target.value))}
                                    className={`w-full px-3 py-2 rounded-lg border text-xs font-mono font-medium outline-none transition-all bg-[rgb(var(--color-input-bg))] border-[rgb(var(--color-input-border))] text-primary focus:border-indigo-500`}
                                >
                                    <option value={1}>1 Hop (Local)</option>
                                    <option value={2}>2 Hops (Deep)</option>
                                    <option value={3}>3 Hops (Wide)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className={`block text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Resolution
                                </label>
                                <select
                                    value={limit}
                                    onChange={(e) => setLimit(Number(e.target.value))}
                                    className={`w-full px-3 py-2 rounded-lg border text-xs font-mono font-medium outline-none transition-all bg-[rgb(var(--color-input-bg))] border-[rgb(var(--color-input-border))] text-primary focus:border-indigo-500`}
                                >
                                    <option value={25}>Low (25)</option>
                                    <option value={50}>Med (50)</option>
                                    <option value={100}>High (100)</option>
                                </select>
                            </div>
                        </div>

                        {/* Execute Button */}
                        <button
                            onClick={handleVisualize}
                            disabled={isLoading || !entity.trim()}
                            className={`w-full py-4 rounded-xl font-bold text-sm tracking-wider uppercase transition-all shadow-lg overflow-hidden relative group ${
                                isLoading || !entity.trim()
                                    ? 'bg-surface-hover text-tertiary cursor-not-allowed border border-border'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400 hover:shadow-indigo-500/40'
                            }`}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Scanning...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">radar</span>
                                        Initialize Scan
                                    </>
                                )}
                            </span>
                            {!isLoading && entity.trim() && (
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            )}
                        </button>

                        <div className="pt-6 border-t border-dashed border-border/50">
                            <div className="flex items-center justify-between mb-3">
                                <label className={`block text-[10px] font-bold uppercase tracking-widest text-tertiary`}>
                                    Quick Coordinates
                                </label>
                                <button 
                                    onClick={generateCoordinates}
                                    disabled={isGeneratingCoords}
                                    className={`p-1 rounded hover:bg-indigo-500/10 transition-colors ${isGeneratingCoords ? 'animate-spin text-indigo-500' : 'text-slate-400 hover:text-indigo-400'}`}
                                    title="Generate new coordinates with Gemini 2.0"
                                >
                                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {quickCoordinates.map(item => (
                                    <button
                                        key={item}
                                        onClick={() => setEntity(item)}
                                        className={`px-3 py-1.5 rounded text-xs font-mono border transition-all bg-surface border-border text-indigo-500 hover:border-indigo-500`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-red-500 text-sm mt-0.5">warning</span>
                                    <p className="text-xs text-red-400 font-mono leading-relaxed">{error}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Footer Status */}
                    <div className={`p-4 text-[10px] uppercase tracking-widest text-center border-t border-border text-tertiary`}>
                        System Status: <span className="text-emerald-500">Online</span>
                    </div>
                </div>

                {/* Main Graph Area */}
                <div className="flex-1 relative overflow-hidden flex flex-col">
                    {graphData ? (
                        <>
                            <GraphVisualization
                                data={graphData}
                                onNodeClick={handleNodeClick}
                                selectedNodeId={selectedNode?.id}
                            >
                                {/* HUD Overlay Info */}
                                <div className={`absolute top-4 left-4 z-20 px-4 py-2 rounded-full border backdrop-blur-sm pointer-events-none animate-in fade-in slide-in-from-top-4 bg-surface/80 border-indigo-500/30 text-primary`}>
                                    <div className="flex items-center gap-3 text-xs font-mono">
                                        <span className="font-bold">{lastQuery}</span>
                                        <span className="w-px h-3 bg-current opacity-30" />
                                        <span>N:{graphData.nodes.length}</span>
                                        <span>E:{graphData.edges.length}</span>
                                    </div>
                                </div>
                                
                                {/* Selected Node Inspector (Right Side Overlay) */}
                                {selectedNode && (
                                    <div className={`absolute top-4 right-4 z-30 w-80 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-right-8 overflow-hidden flex flex-col max-h-[calc(100%-2rem)] bg-surface/90 border-border`}>
                                        {/* Inspector Header */}
                                        <div className="p-4 border-b border-indigo-500/10 bg-gradient-to-r from-indigo-500/10 to-transparent">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 text-indigo-500`}>
                                                        {selectedNode.type}
                                                    </div>
                                                    <h3 className={`text-xl font-bold text-primary`}>
                                                        {selectedNode.name}
                                                    </h3>
                                                </div>
                                                <button 
                                                    onClick={() => setSelectedNode(null)}
                                                    className={`p-1 rounded-lg hover:bg-black/5 text-tertiary`}
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Inspector Content */}
                                        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                                            {isAnalyzing ? (
                                                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                                                    <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                                    <span className="text-xs font-mono text-indigo-400">Analyzing Bio-Data...</span>
                                                </div>
                                            ) : analysisCache[selectedNode.id] ? (
                                                <div className={`prose prose-sm prose-invert max-w-none text-secondary`}>
                                                    <ReactMarkdown 
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            h3: ({node, ...props}) => <h3 className={`text-sm font-bold uppercase tracking-wide mt-4 mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} {...props} />,
                                                            p: ({node, ...props}) => <p className="mb-3 text-xs leading-relaxed" {...props} />,
                                                            ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-3 space-y-1" {...props} />,
                                                            li: ({node, ...props}) => <li className="text-xs pl-1 marker:text-indigo-500" {...props} />,
                                                            strong: ({node, ...props}) => <strong className={`font-bold ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`} {...props} />
                                                        }}
                                                    >
                                                        {analysisCache[selectedNode.id]}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-3 w-full">
                                                    <div className={`p-3 rounded-xl flex items-center gap-3 ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                                                        <span className="material-symbols-outlined text-[20px] text-indigo-400">psychology</span>
                                                        <div className="flex-1">
                                                            <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-0.5">AI Research Assistant</div>
                                                            <div className="text-xs opacity-90">Generate instant clinical insights</div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-2">
                                                        {/* Primary Bio-Brief */}
                                                        <button
                                                            onClick={() => analyzeNode(selectedNode, 'general')}
                                                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-between group hover:brightness-110 transition-all"
                                                        >
                                                            <span>Generate Nano-Brief</span>
                                                            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                                        </button>

                                                        {/* Context Actions based on Type */}
                                                        {(selectedNode.type === 'disease' || selectedNode.type === 'phenotype') && (
                                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                                                <button onClick={() => analyzeNode(selectedNode, 'treatments')} className="p-2 border border-indigo-500/30 rounded hover:bg-indigo-500/10 text-[10px] font-bold uppercase text-indigo-400">
                                                                    Rx Treatments
                                                                </button>
                                                                <button onClick={() => analyzeNode(selectedNode, 'genetics')} className="p-2 border border-indigo-500/30 rounded hover:bg-indigo-500/10 text-[10px] font-bold uppercase text-indigo-400">
                                                                    Genetics
                                                                </button>
                                                            </div>
                                                        )}

                                                        {selectedNode.type === 'drug' && (
                                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                                                <button onClick={() => analyzeNode(selectedNode, 'mechanism')} className="p-2 border border-indigo-500/30 rounded hover:bg-indigo-500/10 text-[10px] font-bold uppercase text-indigo-400">
                                                                    Mech. of Action
                                                                </button>
                                                                <button onClick={() => analyzeNode(selectedNode, 'safety')} className="p-2 border border-indigo-500/30 rounded hover:bg-indigo-500/10 text-[10px] font-bold uppercase text-indigo-400">
                                                                    Safety Profile
                                                                </button>
                                                            </div>
                                                        )}

                                                        {(selectedNode.type === 'gene' || selectedNode.type === 'protein') && (
                                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                                                <button onClick={() => analyzeNode(selectedNode, 'associations')} className="p-2 border border-indigo-500/30 rounded hover:bg-indigo-500/10 text-[10px] font-bold uppercase text-indigo-400">
                                                                    Disease Links
                                                                </button>
                                                                <button onClick={() => analyzeNode(selectedNode, 'genetics')} className="p-2 border border-indigo-500/30 rounded hover:bg-indigo-500/10 text-[10px] font-bold uppercase text-indigo-400">
                                                                    Pathways
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Actions */}
                                            <div className="mt-6 space-y-2">
                                                <button 
                                                    onClick={() => {
                                                        // Heuristic: remove parenthesized type suffix if present (e.g. "Diabetes (disease)" -> "Diabetes")
                                                        // This helps avoid 404s when the graph node name differs strictly from the search index
                                                        const cleanName = selectedNode.name.replace(/\s*\([^)]+\)$/, '');
                                                        setEntity(cleanName);
                                                        setHops(1); // Reset to local view for focused exploration
                                                        handleVisualize(cleanName); // Trigger scan immediately with cleaned name
                                                    }}
                                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">center_focus_strong</span>
                                                    Focus Map Here
                                                </button>
                                                <a 
                                                    href={`https://pubmed.ncbi.nlm.nih.gov/?term=${selectedNode.name}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className={`w-full py-2 border rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-border hover:bg-surface-hover text-secondary`}
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">menu_book</span>
                                                    Open PubMed
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </GraphVisualization>


                        </>
                    ) : (
                        // Empty State / "Standby Mode"
                        <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                            <div className="w-32 h-32 rounded-full border-2 border-indigo-500/30 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                                <div className="w-24 h-24 rounded-full border border-dashed border-indigo-400/50" />
                            </div>
                            <h3 className={`mt-8 text-xl font-bold tracking-widest uppercase text-tertiary`}>
                                Awaiting Input
                            </h3>
                            <p className="mt-2 text-xs font-mono text-tertiary">
                                Initialize scan sequence from control panel
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GraphExplorer;
