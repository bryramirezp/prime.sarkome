import React, { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-hot-toast';
import { kgService } from '../services/kgService';
import GraphVisualization from './GraphVisualization';
import { 
    GraphData, 
    GeminiModel, 
    DrugRepurposingResponse, 
    TherapeuticTargetsResponse, 
    DrugCombinationsResponse, 
    EnvironmentalRiskResponse,
    PhenotypeMatchingResponse
} from '../types';
import { generateResponse } from '../services/geminiService';
import { useApiKey } from '../contexts/ApiKeyContext';

import { useNavigate, useOutletContext } from 'react-router-dom';
import { LayoutContext } from './Layout';

interface GraphExplorerProps {
    darkMode: boolean;
}

const typeColors: Record<string, string> = {
    geneprotein: 'text-emerald-500',
    drug: 'text-blue-500',
    disease: 'text-red-500',
    phenotype: 'text-orange-500',
    pathway: 'text-pink-500',
    biologicalprocess: 'text-cyan-500',
    molecularfunction: 'text-violet-500',
    cellularcomponent: 'text-teal-500',
    anatomy: 'text-yellow-500',
    exposure: 'text-indigo-500',
    unknown: 'text-slate-500'
};

const getHighlightColor = (type: string) => {
    const key = type.toLowerCase().replace(/[\/\s\_-]/g, '');
    return typeColors[key] || typeColors.unknown;
};

const GraphExplorer: React.FC<GraphExplorerProps> = ({ darkMode }) => {
    const { apiKey, isValid } = useApiKey();
    const { onShowApiKeyModal } = useOutletContext<LayoutContext>();
    const [entity, setEntity] = useState('');
    const [hops, setHops] = useState(() => {
        const saved = localStorage.getItem('primekg_graph_hops');
        return saved ? Number(saved) : 1;
    });
    const [limit, setLimit] = useState(() => {
        const saved = localStorage.getItem('primekg_graph_limit');
        return saved ? Number(saved) : 50;
    });

    useEffect(() => {
        localStorage.setItem('primekg_graph_hops', String(hops));
    }, [hops]);

    useEffect(() => {
        localStorage.setItem('primekg_graph_limit', String(limit));
    }, [limit]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [lastQuery, setLastQuery] = useState<string>('');
    
    // Inspector State
    const [selectedNode, setSelectedNode] = useState<any | null>(null);
    const [analysisCache, setAnalysisCache] = useState<Record<string, string>>({});
    const [analysisResults, setAnalysisResults] = useState<any | null>(null);
    const [activeAnalysisType, setActiveAnalysisType] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Quick Coordinates State
    const [quickCoordinates, setQuickCoordinates] = useState<string[]>(['Pembrolizumab', 'PCSK9', 'CRISPR', 'Semaglutide']);
    const [isGeneratingCoords, setIsGeneratingCoords] = useState(false);

    // Search Suggestions
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Debounced Search Logic
    useEffect(() => {
        if (entity.trim().length < 2) {
            setSuggestions([]);
            return;
        }

        const handler = setTimeout(async () => {
            try {
                const results = await kgService.searchSemantic(entity);
                setSuggestions(results.slice(0, 5));
            } catch (err) {
                console.error("Suggestion fetch failed", err);
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [entity]);

    // Path Finding State
    const [pathSource, setPathSource] = useState<any | null>(null);
    const [highlightedEdges, setHighlightedEdges] = useState<Set<string>>(new Set());

    const generateCoordinates = async () => {
        if (!isValid) {
            onShowApiKeyModal();
            return;
        }
        setIsGeneratingCoords(true);
        try {
            // Include current coordinates to force variety (negative prompting)
            const currentCoordsStr = quickCoordinates.join(', ');
            const prompt = `Act as a high-end biomedical data scientist explorer. 
            Generate 4 distinct, highly relevant biomedical entities (Drugs, Genes, or Diseases) for a knowledge graph.
            
            RULES:
            1. DO NOT mention any of these: ${currentCoordsStr}.
            2. Focus on: Precision Medicine, Rare Diseases, Oncology, or Immunotherapy.
            3. Must be official names (e.g., 'Metformin', 'BRCA1', 'Cystic Fibrosis').
            4. Return ONLY a raw JSON array of strings, e.g. ["Entity1", "Entity2", "Entity3", "Entity4"]. 
            5. No markdown formatting, no code blocks.`;
            
            const response = await generateResponse(prompt, [], GeminiModel.FLASH_2_0_EXP, apiKey || undefined);
            const text = response.text.replace(/```json|```/g, '').trim();
            const newCoords = JSON.parse(text);
            
            if (Array.isArray(newCoords) && newCoords.length > 0) {
                setQuickCoordinates(newCoords.slice(0, 4));
                toast.success("Coordinates Rotated", {
                    icon: '🛰️',
                    style: {
                        background: darkMode ? '#18181b' : '#fff',
                        color: darkMode ? '#fff' : '#333',
                        border: '1px solid rgb(var(--color-border))',
                    }
                });
            }
        } catch (err) {
            console.error("Failed to generate coordinates", err);
            toast.error("Failed to refresh coordinates");
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

            // Persist the scan depth preference on execution
            localStorage.setItem('primekg_graph_hops', String(hops));

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
                type: n.type || n.node_type || 'unknown',
                description: n.description || ''
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

    // Expand Node (Add neighbors to current graph)
    const handleExpandNode = async (node: any) => {
        setIsLoading(true);
        try {
            const data = await kgService.getNeighbors(node.id);
            if (!data.nodes || data.nodes.length === 0) {
                toast.error("No further connections found for this entity.");
                return;
            }

            setGraphData(prev => {
                if (!prev) return { nodes: data.nodes, edges: data.edges };
                
                const existingNodeIds = new Set(prev.nodes.map(n => n.id));
                const newNodes = data.nodes.filter(n => !existingNodeIds.has(n.name || n.id || n.db_id)).map(n => ({
                    id: n.name || n.id || n.db_id,
                    name: n.name || n.node_name || n.id,
                    type: n.type || n.node_type || 'unknown',
                    description: n.description || ''
                }));

                // Avoid duplicate edges
                const existingEdgeKeys = new Set(prev.edges.map(e => `${e.source}-${e.target}-${e.relation}`));
                const newEdges = (data.edges || []).filter(e => {
                    const key = `${e.source}-${e.target}-${e.relation}`;
                    return !existingEdgeKeys.has(key);
                });

                return {
                    nodes: [...prev.nodes, ...newNodes],
                    edges: [...prev.edges, ...newEdges]
                };
            });
            
            toast.success(`Network expanded: +${data.nodes.length} nodes`);
        } catch (err) {
            console.error("Expand error:", err);
            toast.error("Failed to expand network.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFindPath = async (source: string, target: string) => {
        setIsLoading(true);
        setError(null);
        setHighlightedEdges(new Set());
        try {
            const data = await kgService.getShortestPath(source, target);
            if (!data.nodes || data.nodes.length === 0) {
                toast.error(`No paths found between ${source} and ${target}.`);
                return;
            }

            // Merge path nodes into graph if not already there
            setGraphData(prev => {
                const existingNodes = prev?.nodes || [];
                const existingEdges = prev?.edges || [];
                const existingNodeIds = new Set(existingNodes.map(n => n.id));
                const existingEdgeKeys = new Set(existingEdges.map(e => `${e.source}-${e.target}-${e.relation}`));

                const newNodes = data.nodes.filter(n => !existingNodeIds.has(n.name || n.id || n.db_id)).map(n => ({
                    id: n.name || n.id || n.db_id,
                    name: n.name || n.node_name || n.id,
                    type: n.type || n.node_type || 'unknown',
                    description: n.description || ''
                }));

                const newEdges = data.edges.filter(e => {
                    const key = `${e.source}-${e.target}-${e.relation}`;
                    return !existingEdgeKeys.has(key);
                });

                // Set highlighted edges
                const pathKeys = new Set(data.edges.map(e => `${e.source}-${e.target}-${e.relation}`));
                setHighlightedEdges(pathKeys);

                return {
                    nodes: [...existingNodes, ...newNodes],
                    edges: [...existingEdges, ...newEdges]
                };
            });

            toast.success(`Path resolved: ${data.nodes.length} nodes in sequence`);
            setPathSource(null);
        } catch (err) {
            console.error("Path error:", err);
            const errMsg = err instanceof Error ? err.message : String(err);
            
            // Check if it's a "No path found" 404 error from the backend
            if (errMsg.includes('404') || errMsg.toLowerCase().includes('no path found')) {
                toast(`No biological path found between these entities within the search limit.`, {
                    icon: '🔍',
                    style: {
                        background: darkMode ? '#27272a' : '#fff',
                        color: darkMode ? '#f4f4f5' : '#3f3f46',
                        border: '1px solid rgba(168, 85, 247, 0.4)'
                    }
                });
            } else {
                toast.error("Failed to resolve biological path.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Node Click - Open Inspector
    const handleNodeClick = (node: any) => {
        setSelectedNode(node);
        setAnalysisResults(null);
        setActiveAnalysisType(null);
    };

    const handleApiAnalysis = async (node: any, type: string) => {
        setIsAnalyzing(true);
        setActiveAnalysisType(type);
        setAnalysisResults(null);
        try {
            let result: any = null;
            switch(type) {
                case 'repurposing':
                    result = await kgService.getDrugRepurposing(node.name);
                    break;
                case 'targets':
                    result = await kgService.getTherapeuticTargets(node.name);
                    break;
                case 'combinations':
                    result = await kgService.getDrugCombinations(node.name);
                    break;
                case 'phenotypes':
                    result = await kgService.getPhenotypeMatching(node.name);
                    break;
                case 'environmental':
                    result = await kgService.getEnvironmentalRisks(node.name);
                    break;
                case 'subgraph':
                    const subgraphData = await kgService.getSubgraph(node.name, 1, 30);
                    if (subgraphData.nodes.length > 0) {
                        setGraphData(prev => {
                            if (!prev) return subgraphData;
                            const existingNodeIds = new Set(prev.nodes.map(n => n.id));
                            const newNodes = subgraphData.nodes.filter(n => !existingNodeIds.has(n.name || n.id || n.db_id)).map(n => ({
                                id: n.name || n.id || n.db_id,
                                name: n.name || n.node_name || n.id,
                                type: n.type || n.node_type || 'unknown',
                                description: n.description || ''
                            }));
                            const existingEdgeKeys = new Set(prev.edges.map(e => `${e.source}-${e.target}-${e.relation}`));
                            const newEdges = subgraphData.edges.filter(e => {
                                const key = `${e.source}-${e.target}-${e.relation}`;
                                return !existingEdgeKeys.has(key);
                            });
                            return {
                                nodes: [...prev.nodes, ...newNodes],
                                edges: [...prev.edges, ...newEdges]
                            };
                        });
                        toast.success("Local subgraph merged into view.");
                    }
                    break;
            }
            setAnalysisResults(result);
        } catch (err) {
            console.error(`Analysis ${type} failed:`, err);
            toast.error(`Failed to retrieve ${type} data.`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const analyzeNode = async (node: any, context: string = 'general') => {
        if (!isValid) {
            onShowApiKeyModal();
            return;
        }
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
                                Graph Explorer
                            </h2>
                        </div>
                        <h2 className="text-xl font-bold text-foreground">
                            Precision Discovery Map
                        </h2>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto space-y-6">
                        {/* Entity Input */}
                        <div className="space-y-2">
                            <label className={`block text-[10px] font-bold uppercase tracking-widest text-tertiary`}>
                                Target Entity Coordinates
                            </label>
                            <div className="relative group">
                                <span className="absolute left-3 top-3 text-[18px] transition-colors text-muted-foreground group-focus-within:text-indigo-500">
                                    ©
                                </span>
                                <input
                                    type="text"
                                    value={entity}
                                    onChange={(e) => setEntity(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => setShowSuggestions(true)}
                                    placeholder="Enter Gene, Drug, Disease, or describe a concept..."
                                    className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm font-mono transition-all outline-none focus:ring-2 focus:ring-indigo-500/50 bg-[rgb(var(--color-input-bg))] border-[rgb(var(--color-input-border))] text-primary placeholder-tertiary shadow-inner`}
                                />
                                
                                {/* Suggestions Menu */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        {suggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    setEntity(s.name);
                                                    setShowSuggestions(false);
                                                    handleVisualize(s.name);
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-indigo-500/10 flex flex-col gap-0.5 border-b border-border/50 last:border-0"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-bold text-primary">{s.name}</span>
                                                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${getHighlightColor(s.type)} bg-current/10`}>
                                                        {s.type}
                                                    </span>
                                                </div>
                                                {s.description && (
                                                    <p className="text-[10px] text-tertiary truncate italic opacity-70">
                                                        {s.description}
                                                    </p>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sliders / Selectors */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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
                                    className={`p-1 rounded hover:bg-indigo-500/10 transition-colors ${isGeneratingCoords ? 'animate-spin text-indigo-500' : 'text-muted-foreground hover:text-indigo-500'}`}
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
                                highlightedEdges={highlightedEdges}
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
                                                    <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${getHighlightColor(selectedNode.type)} flex items-center gap-1`}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                        {selectedNode.type}
                                                    </div>
                                                    <h3 className={`text-xl font-bold text-primary`}>
                                                        {selectedNode.name}
                                                    </h3>
                                                    {selectedNode.description && (
                                                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 italic">
                                                            {selectedNode.description}
                                                        </p>
                                                    )}
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
                                                    <span className="text-xs font-mono text-indigo-400">Processing Bio-Signals...</span>
                                                </div>
                                            ) : analysisResults ? (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                                    <button 
                                                        onClick={() => setAnalysisResults(null)}
                                                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase tracking-tighter"
                                                    >
                                                        <span className="material-symbols-outlined text-[12px]">arrow_back</span>
                                                        Back to Research tools
                                                    </button>

                                                    <div className="space-y-2">
                                                        <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-[18px] text-indigo-400">
                                                                {activeAnalysisType === 'repurposing' ? 'medication' : 
                                                                 activeAnalysisType === 'targets' ? 'target' : 
                                                                 activeAnalysisType === 'environmental' ? 'eco' : 'analytics'}
                                                            </span>
                                                            {activeAnalysisType === 'repurposing' ? 'Repurposing Candidates' : 
                                                             activeAnalysisType === 'targets' ? 'Therapeutic Targets' : 
                                                             activeAnalysisType === 'combinations' ? 'Synergy Combinations' : 
                                                             activeAnalysisType === 'environmental' ? 'Environmental Risks' : 'Analysis Result'}
                                                        </h4>

                                                        {activeAnalysisType === 'repurposing' && analysisResults.candidates?.map((c: any, i: number) => (
                                                            <div key={i} className="p-2 border border-border rounded-lg bg-surface/50 flex items-center justify-between group hover:border-indigo-500/50 transition-colors">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-xs font-bold text-primary truncate">{c.drug}</div>
                                                                    <div className="text-[10px] text-tertiary">Match Score: {c.score.toFixed(2)}</div>
                                                                </div>
                                                                <button 
                                                                    onClick={() => { setEntity(c.drug); handleVisualize(c.drug); }}
                                                                    className="p-1 text-indigo-400 hover:bg-indigo-500/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">radar</span>
                                                                </button>
                                                            </div>
                                                        ))}

                                                        {activeAnalysisType === 'targets' && analysisResults.targets?.map((t: any, i: number) => (
                                                            <div key={i} className="p-2 border border-border rounded-lg bg-surface/50 flex items-center justify-between group hover:border-red-500/50 transition-colors">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-xs font-bold text-primary truncate">{t.gene}</div>
                                                                    <div className="text-[10px] text-tertiary">Evidence: {t.evidence_count || 0} hits</div>
                                                                </div>
                                                                <button 
                                                                    onClick={() => { setEntity(t.gene); handleVisualize(t.gene); }}
                                                                    className="p-1 text-red-400 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">radar</span>
                                                                </button>
                                                            </div>
                                                        ))}

                                                        {activeAnalysisType === 'combinations' && analysisResults.combinations?.map((c: any, i: number) => (
                                                            <div key={i} className="p-2 border border-border rounded-lg bg-surface/50 flex items-center justify-between group hover:border-blue-500/50 transition-colors">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-xs font-bold text-primary truncate">{c.drug}</div>
                                                                    <div className="text-[10px] text-tertiary">Synergy: {c.synergy?.toFixed(2) || 'N/A'}</div>
                                                                </div>
                                                                <button 
                                                                    onClick={() => { setEntity(c.drug); handleVisualize(c.drug); }}
                                                                    className="p-1 text-blue-400 hover:bg-blue-500/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">radar</span>
                                                                </button>
                                                            </div>
                                                        ))}

                                                        {activeAnalysisType === 'environmental' && analysisResults.risks?.map((r: any, i: number) => (
                                                            <div key={i} className="p-2 border border-border rounded-lg bg-surface/50 space-y-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-bold text-primary">{r.exposure}</span>
                                                                    <span className="text-[9px] px-1 bg-emerald-500/10 text-emerald-500 rounded font-mono uppercase">{r.exposure_type}</span>
                                                                </div>
                                                                <div className="text-[10px] text-tertiary line-clamp-2">{r.relationship}</div>
                                                            </div>
                                                        ))}

                                                        {activeAnalysisType === 'phenotypes' && analysisResults.candidates?.map((c: any, i: number) => (
                                                            <div key={i} className="p-2 border border-border rounded-lg bg-surface/50 space-y-2 group hover:border-orange-500/50 transition-colors">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="text-xs font-bold text-primary truncate">{c.drug}</div>
                                                                    <button 
                                                                        onClick={() => { setEntity(c.drug); handleVisualize(c.drug); }}
                                                                        className="p-1 text-orange-400 hover:bg-orange-500/10 rounded"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[14px]">radar</span>
                                                                    </button>
                                                                </div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {c.shared_phenotypes?.slice(0, 3).map((p: string, j: number) => (
                                                                        <span key={j} className="text-[8px] px-1.5 py-0.5 bg-orange-500/5 text-orange-400 border border-orange-500/10 rounded-full">
                                                                            {p}
                                                                        </span>
                                                                    ))}
                                                                    {c.shared_phenotypes?.length > 3 && (
                                                                        <span className="text-[8px] text-tertiary">+{c.shared_phenotypes.length - 3} more</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[9px] text-tertiary">Overlap Score: {c.overlap_score?.toFixed(2)}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : analysisCache[selectedNode.id] ? (
                                                <div className="space-y-4">
                                                    <button 
                                                        onClick={() => setAnalysisCache(prev => { const n = {...prev}; delete n[selectedNode.id]; return n; })}
                                                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase tracking-tighter"
                                                    >
                                                        <span className="material-symbols-outlined text-[12px]">arrow_back</span>
                                                        Reset Gemini Brief
                                                    </button>
                                                    <div className={`prose prose-sm prose-invert max-w-none text-muted-foreground`}>
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
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-4 w-full">
                                                    {/* Tool Sets */}
                                                    <div className="space-y-4">
                                                        {/* Primary Bio-Brief */}
                                                        <button
                                                            onClick={() => analyzeNode(selectedNode, 'general')}
                                                            className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-between group hover:brightness-110 transition-all"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-[18px]">psychology</span>
                                                                <span>Generate Nano-Brief</span>
                                                            </div>
                                                            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">bolt</span>
                                                        </button>

                                                        {/* Specialized Intelligence Tools */}
                                                        <div className="space-y-2">
                                                            <h5 className="text-[10px] font-bold text-tertiary uppercase tracking-widest pl-1">Bio-Intelligence Tools</h5>
                                                            
                                                            <div className="grid grid-cols-1 gap-2">
                                                                {(selectedNode.type === 'disease' || selectedNode.type === 'phenotype') && (
                                                                    <>
                                                                        <button onClick={() => handleApiAnalysis(selectedNode, 'repurposing')} className="flex items-center gap-3 p-2.5 border border-border rounded-xl hover:bg-surface-hover hover:border-indigo-500/50 transition-all group">
                                                                            <span className="material-symbols-outlined text-indigo-400 group-hover:scale-110 transition-transform">medication_liquid</span>
                                                                            <div className="text-left">
                                                                                <div className="text-[11px] font-bold text-primary">Repurposing Scan</div>
                                                                                <div className="text-[9px] text-tertiary">Find FDA-approved candidates</div>
                                                                            </div>
                                                                        </button>
                                                                        <button onClick={() => handleApiAnalysis(selectedNode, 'targets')} className="flex items-center gap-3 p-2.5 border border-border rounded-xl hover:bg-surface-hover hover:border-red-500/50 transition-all group">
                                                                            <span className="material-symbols-outlined text-red-400 group-hover:scale-110 transition-transform">target</span>
                                                                            <div className="text-left">
                                                                                <div className="text-[11px] font-bold text-primary">Target Discovery</div>
                                                                                <div className="text-[9px] text-tertiary">Identify therapeutic vulnerabilities</div>
                                                                            </div>
                                                                        </button>
                                                                        <button onClick={() => handleApiAnalysis(selectedNode, 'environmental')} className="flex items-center gap-3 p-2.5 border border-border rounded-xl hover:bg-surface-hover hover:border-emerald-500/50 transition-all group">
                                                                            <span className="material-symbols-outlined text-emerald-400 group-hover:scale-110 transition-transform">eco</span>
                                                                            <div className="text-left">
                                                                                <div className="text-[11px] font-bold text-primary">Risk Analytics</div>
                                                                                <div className="text-[9px] text-tertiary">Environmental & Exposure factors</div>
                                                                            </div>
                                                                        </button>
                                                                        <button onClick={() => handleApiAnalysis(selectedNode, 'phenotypes')} className="flex items-center gap-3 p-2.5 border border-border rounded-xl hover:bg-surface-hover hover:border-orange-500/50 transition-all group">
                                                                            <span className="material-symbols-outlined text-orange-400 group-hover:scale-110 transition-transform">biotech</span>
                                                                            <div className="text-left">
                                                                                <div className="text-[11px] font-bold text-primary">Phenotype Discovery</div>
                                                                                <div className="text-[9px] text-tertiary">Similar diseases & drugs</div>
                                                                            </div>
                                                                        </button>
                                                                    </>
                                                                )}

                                                                {selectedNode.type === 'drug' && (
                                                                    <>
                                                                        <button onClick={() => handleApiAnalysis(selectedNode, 'combinations')} className="flex items-center gap-3 p-2.5 border border-border rounded-xl hover:bg-surface-hover hover:border-blue-500/50 transition-all group">
                                                                            <span className="material-symbols-outlined text-blue-400 group-hover:scale-110 transition-transform">join_inner</span>
                                                                            <div className="text-left">
                                                                                <div className="text-[11px] font-bold text-primary">Synergy Combinations</div>
                                                                                <div className="text-[9px] text-tertiary">Find high-potential pairings</div>
                                                                            </div>
                                                                        </button>
                                                                        <button onClick={() => analyzeNode(selectedNode, 'mechanism')} className="flex items-center gap-3 p-2.5 border border-border rounded-xl hover:bg-surface-hover hover:border-amber-500/50 transition-all group">
                                                                            <span className="material-symbols-outlined text-amber-400 group-hover:scale-110 transition-transform">settings_accessibility</span>
                                                                            <div className="text-left">
                                                                                <div className="text-[11px] font-bold text-primary">MoA Summary</div>
                                                                                <div className="text-[9px] text-tertiary">Gemini Mechanism Analysis</div>
                                                                            </div>
                                                                        </button>
                                                                    </>
                                                                )}

                                                                {(selectedNode.type === 'gene' || selectedNode.type === 'protein') && (
                                                                    <button onClick={() => analyzeNode(selectedNode, 'associations')} className="flex items-center gap-3 p-2.5 border border-border rounded-xl hover:bg-surface-hover hover:border-indigo-500/50 transition-all group">
                                                                        <span className="material-symbols-outlined text-indigo-400 group-hover:scale-110 transition-transform">link</span>
                                                                        <div className="text-left">
                                                                            <div className="text-[11px] font-bold text-primary">Clinical Context</div>
                                                                            <div className="text-[9px] text-tertiary">Top associated disease states</div>
                                                                        </div>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
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
                                                        // Do not reset hops; keep user preference
                                                        handleVisualize(cleanName); // Trigger scan immediately with cleaned name
                                                    }}
                                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">center_focus_strong</span>
                                                    Focus Map Here
                                                </button>
                                                <button 
                                                    onClick={() => handleExpandNode(selectedNode)}
                                                    className={`w-full py-2 border rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10`}
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">dynamic_feed</span>
                                                    Expand Neighbors
                                                </button>
                                                <button 
                                                    onClick={() => handleApiAnalysis(selectedNode, 'subgraph')}
                                                    className={`w-full py-2 border rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10`}
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">hub</span>
                                                    Extract Subgraph
                                                </button>
                                                <div className="pt-2">
                                                    <button 
                                                        onClick={() => {
                                                            if (pathSource && pathSource.id === selectedNode.id) {
                                                                // Deselect if same
                                                                setPathSource(null);
                                                            } else if (pathSource) {
                                                                // If source already exists, this is the target
                                                                handleFindPath(pathSource.name, selectedNode.name);
                                                            } else {
                                                                // Set as source
                                                                setPathSource(selectedNode);
                                                                toast.success(`Starting from: ${selectedNode.name}. Now select a destination node.`, { icon: '📍' });
                                                            }
                                                        }}
                                                        className={`w-full py-2 border rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                                            pathSource?.id === selectedNode.id 
                                                                ? 'bg-amber-500 text-white border-amber-400 hover:bg-amber-600 shadow-md' 
                                                                : pathSource 
                                                                    ? 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-600 shadow-md animate-pulse' // Prompt to complete path
                                                                    : 'border-border text-muted-foreground hover:bg-surface-hover'
                                                        }`}
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">
                                                            {pathSource?.id === selectedNode.id ? 'pin_drop' : pathSource ? 'route' : 'alt_route'}
                                                        </span>
                                                        {pathSource?.id === selectedNode.id 
                                                            ? 'Path Origin (Cancel)' 
                                                            : pathSource 
                                                                ? 'Calculate Path to Here' 
                                                                : 'Find Shortest Path'}
                                                    </button>
                                                    {pathSource && (
                                                        <button 
                                                            onClick={() => setPathSource(null)}
                                                            className="w-full mt-1 text-[10px] text-red-400 hover:text-red-500 font-bold uppercase tracking-tight py-1"
                                                        >
                                                            Cancel Pathfinding
                                                        </button>
                                                    )}
                                                </div>
                                                <a 
                                                    href={`https://pubmed.ncbi.nlm.nih.gov/?term=${selectedNode.name}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className={`w-full py-2 border rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-border hover:bg-surface-hover text-muted-foreground`}
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
<button class="p-1 rounded hover:bg-indigo-500/10 transition-colors text-muted-foreground hover:text-indigo-500" title="Generate new coordinates with Gemini 2.0"><span class="material-symbols-outlined text-[14px]">refresh</span></button>