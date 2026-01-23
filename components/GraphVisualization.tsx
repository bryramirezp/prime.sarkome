import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { GraphData, KGNode, KGEdge } from '../types';

interface GraphVisualizationProps {
    data: GraphData;
    darkMode?: boolean;
    width?: number;
    height?: number;
    className?: string;
    onNodeClick?: (node: KGNode) => void;
}

// Normalized node color palette
// Normalized node color palette based on PrimeKG Entity Types
const nodeColors: Record<string, string> = {
    // 1. Core Biological Entities
    geneprotein: '#22c55e',       // Green (Central dogma)
    gene_protein: '#22c55e',      // Alternative key
    
    // 2. Pharmacology
    drug: '#3b82f6',              // Blue (Intervention)
    
    // 3. Pathology
    disease: '#ef4444',           // Red (Condition)
    phenotype: '#f97316',         // Orange (Symptom/Characteristic)
    
    // 4. Biological Systems & Functions (GO Terms)
    pathway: '#ec4899',           // Pink (Network)
    biologicalprocess: '#06b6d4', // Cyan (Process)
    biological_process: '#06b6d4',
    molecularfunction: '#8b5cf6', // Violet (Function)
    molecular_function: '#8b5cf6',
    cellularcomponent: '#14b8a6', // Teal (Location)
    cellular_component: '#14b8a6',
    
    // 5. Structure & Environment
    anatomy: '#eab308',           // Yellow (Structure)
    exposure: '#6366f1',          // Indigo (Environment/Chemical)
    
    default: '#64748b'            // Slate
};

const edgeColors: Record<string, string> = {
    // Treatments / Positive
    indication: '#3b82f6', // Blue (treats)
    off_label_use: '#06b6d4', // Cyan (unapproved but used)
    target: '#f59e0b', // Amber (drug targets)
    synergistic_interaction: '#8b5cf6', // Violet (enhances effect)
    
    // Negative / Warnings
    contraindication: '#ef4444', // Red (avoid)
    side_effect: '#f97316', // Orange (adverse event)
    phenotype_absent: '#e11d48', // Rose (disease does NOT show phenotype)
    expression_absent: '#ec4899', // Pink (gene NOT expressed)
    
    // Biological / Neutral / Associations
    ppi: '#10b981', // Emerald (protein-protein interaction)
    interacts_with: '#94a3b8', // Slate (generic interaction)
    associated_with: '#a855f7', // Purple (gene associated with disease)
    parent_child: '#71717a', // Zinc (ontology hierarchy)
    linked_to: '#64748b', // Gray (exposure linked to disease)
    
    // Expression / Presence
    expression_present: '#22c55e', // Green (gene expressed)
    phenotype_present: '#14b8a6', // Teal (disease shows phenotype)
    
    // Pharmacokinetics (Metabolism/Transport)
    enzyme: '#eab308', // Yellow (metabolized by)
    transporter: '#84cc16', // Lime (transported by)
    carrier: '#6366f1', // Indigo (carried by)
    
    default: '#94a3b8' // Slate
};

function getNodeColor(type: string): string {
    if (!type) return nodeColors.default;
    
    // Normalize: Remove spaces, underscores, and convert to lowercase for robust matching
    // e.g., "Gene/Protein" -> "geneprotein", "Biological Process" -> "biologicalprocess"
    const normalizedKey = type.toLowerCase().replace(/[\/\s\_-]/g, '');
    
    // Direct lookup
    if (nodeColors[normalizedKey]) return nodeColors[normalizedKey];
    
    // Fallback partial matching if exact key isn't found (robustness)
    if (normalizedKey.includes('gene') || normalizedKey.includes('protein')) return nodeColors.geneprotein;
    if (normalizedKey.includes('drug') || normalizedKey.includes('chem')) return nodeColors.drug;
    if (normalizedKey.includes('disease')) return nodeColors.disease;
    if (normalizedKey.includes('pathway')) return nodeColors.pathway;
    if (normalizedKey.includes('anatomy')) return nodeColors.anatomy;
    if (normalizedKey.includes('phenotype')) return nodeColors.phenotype;
    if (normalizedKey.includes('exposure')) return nodeColors.exposure;
    if (normalizedKey.includes('process')) return nodeColors.biologicalprocess;
    if (normalizedKey.includes('function')) return nodeColors.molecularfunction;
    if (normalizedKey.includes('component')) return nodeColors.cellularcomponent;
    
    return nodeColors.default;
}

function getEdgeColor(relation: string): string {
    if (!relation) return edgeColors.default;
    const key = relation.toLowerCase();
    
    // Exact match trial first (normalized)
    if (edgeColors[key]) return edgeColors[key];
    
    // Soft matching for variations
    if (key.includes('ppi')) return edgeColors.ppi;
    if (key.includes('synergistic')) return edgeColors.synergistic_interaction;
    if (key.includes('indication') && !key.includes('contra')) return edgeColors.indication;
    if (key.includes('contraindication')) return edgeColors.contraindication;
    if (key.includes('target')) return edgeColors.target;
    if (key.includes('enzyme')) return edgeColors.enzyme;
    if (key.includes('transporter')) return edgeColors.transporter;
    if (key.includes('carrier')) return edgeColors.carrier;
    if (key.includes('side') || key.includes('effect')) return edgeColors.side_effect; // broadened match
    if (key.includes('associated')) return edgeColors.associated_with;
    if (key.includes('phenotype') && key.includes('present')) return edgeColors.phenotype_present;
    if (key.includes('phenotype') && key.includes('absent')) return edgeColors.phenotype_absent;
    if (key.includes('expression') && key.includes('present')) return edgeColors.expression_present;
    if (key.includes('expression') && key.includes('absent')) return edgeColors.expression_absent;
    if (key.includes('off') || key.includes('label')) return edgeColors.off_label_use;
    if (key.includes('parent') || key.includes('child')) return edgeColors.parent_child;
    if (key.includes('linked')) return edgeColors.linked_to;
    
    return edgeColors.default;
}

interface SimNode extends d3.SimulationNodeDatum {
    id: string;
    type: string;
    name: string;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
    relation: string;
    source: string | SimNode;
    target: string | SimNode;
}

const GraphVisualization = React.memo(function GraphVisualization({
    data,
    darkMode = true,
    width = 600,
    height = 400,
    className = "",
    onNodeClick,
    selectedNodeId,
    children
}: GraphVisualizationProps & { selectedNodeId?: string, children?: React.ReactNode }) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

    // State for UI/UX
    const [dimensions, setDimensions] = useState({ width, height });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    
    // Derived active state
    const activeNodeId = hoveredNode || selectedNodeId;

    // Fullscreen toggle handler
    const toggleFullscreen = useCallback(async () => {
        if (!containerRef.current) return;

        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (err) {
            console.error("Error toggling fullscreen:", err);
            setIsFullscreen(!isFullscreen);
        }
    }, [isFullscreen]);

    // Handle resize observer
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width: w, height: h } = entry.contentRect;
                if (w > 0 && h > 0) {
                    setDimensions({ width: w, height: h });
                }
            }
        });

        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, []);

    // Handle native fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Initialization Effect: Set up SVG layers and persistent simulation
    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Initial clear only

        const { width: w, height: h } = dimensions;
        const isMobile = w < 768;

        // Container group
        const g = svg.append('g').attr('class', 'main-container');
        gRef.current = g;

        // Layer groups for proper Z-indexing
        g.append('g').attr('class', 'links-layer');
        g.append('g').attr('class', 'link-labels-layer');
        g.append('g').attr('class', 'nodes-layer');

        // Zoom setup
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
                setZoomLevel(event.transform.k);
            });
        
        zoomRef.current = zoom;
        svg.call(zoom);

        // Marker Definitions
        const defs = svg.append('defs');
        const updateMarkers = () => {
             defs.selectAll('marker').remove();
             Object.entries(edgeColors).forEach(([key, color]) => {
                defs.append('marker')
                .attr('id', `arrowhead-${key}`)
                .attr('viewBox', '-0 -5 10 10')
                .attr('refX', 22)
                .attr('refY', 0)
                .attr('orient', 'auto')
                .attr('markerWidth', 5)
                .attr('markerHeight', 5)
                .append('path')
                .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
                .attr('fill', color)
                .style('opacity', 0.8);
            });
        };
        updateMarkers();

        // Persistent Simulation
        const simulation = d3.forceSimulation<SimNode>()
            .force('link', d3.forceLink<SimNode, SimLink>().id(d => d.id).distance(isMobile ? 80 : 120))
            .force('charge', d3.forceManyBody().strength(isMobile ? -200 : -400))
            .force('center', d3.forceCenter(w / 2, h / 2))
            .force('collide', d3.forceCollide().radius(isMobile ? 30 : 40).strength(0.5));

        if (isMobile) {
            simulation.alphaDecay(0.05).velocityDecay(0.4);
        }

        simulationRef.current = simulation;

        return () => {
            simulation.stop();
            simulationRef.current = null;
        };
    }, [dimensions.width, dimensions.height]); // Re-run only on major dimension changes or mount

    // Update Effect: Handle data changes using Join pattern
    useEffect(() => {
        if (!simulationRef.current || !data.nodes?.length || !gRef.current) return;

        const simulation = simulationRef.current;
        const g = gRef.current;
        const isMobile = dimensions.width < 768;

        // 1. Prepare Data with mapping to preserve positions of existing nodes
        const oldNodes = new Map(simulation.nodes().map(d => [d.id, d]));
        
        let renderNodesData = data.nodes;
        let renderEdgesData = data.edges;

        if (isMobile && data.nodes.length > 50) {
            renderNodesData = data.nodes.slice(0, 50);
            renderEdgesData = data.edges.filter(e =>
                renderNodesData.some(n => n.id === e.source) &&
                renderNodesData.some(n => n.id === e.target)
            );
        }

        const nodes: SimNode[] = renderNodesData.map(n => ({
            ...oldNodes.get(n.id),
            ...n
        } as SimNode));

        const links: SimLink[] = renderEdgesData.map(e => ({
            ...e
        } as SimLink));

        // 2. Update Simulation
        simulation.nodes(nodes);
        (simulation.force('link') as d3.ForceLink<SimNode, SimLink>).links(links);
        
        // Dynamic Type Clustering Force
        // This pulls nodes of the same type (color) towards specific sectors of the canvas
        const uniqueTypes = Array.from(new Set(nodes.map(n => n.type))).sort();
        if (uniqueTypes.length > 1) {
            const angleStep = (2 * Math.PI) / uniqueTypes.length;
            const clusterRadius = Math.min(dimensions.width, dimensions.height) / 3; // Radius of the cluster ring

            // Configure X clustering
            simulation.force('preserve_x', d3.forceX<SimNode>(d => {
                const index = uniqueTypes.indexOf(d.type);
                const angle = index * angleStep;
                return dimensions.width / 2 + Math.cos(angle) * clusterRadius;
            }).strength(0.15)); // Gentle strength to bias layout but keep topology

            // Configure Y clustering
            simulation.force('preserve_y', d3.forceY<SimNode>(d => {
                const index = uniqueTypes.indexOf(d.type);
                const angle = index * angleStep;
                return dimensions.height / 2 + Math.sin(angle) * clusterRadius;
            }).strength(0.15));
        } else {
            // Remove forces if only 1 type exists (fall back to standard layout)
            simulation.force('preserve_x', null);
            simulation.force('preserve_y', null);
        }

        simulation.alpha(1).restart();

        // 3. Helper to get key for marker
        const getEdgeColorKey = (relation: string): string => {
            if (!relation) return 'default';
            const key = relation.toLowerCase();
            
            if (key.includes('ppi')) return 'ppi';
            if (key.includes('synergistic')) return 'synergistic_interaction';
            if (key.includes('indication') && !key.includes('contra')) return 'indication';
            if (key.includes('contraindication')) return 'contraindication';
            if (key.includes('target')) return 'target';
            if (key.includes('enzyme')) return 'enzyme';
            if (key.includes('transporter')) return 'transporter';
            if (key.includes('carrier')) return 'carrier';
            if (key.includes('side') || key.includes('effect')) return 'side_effect';
            if (key.includes('associated')) return 'associated_with';
            if (key.includes('phenotype') && key.includes('present')) return 'phenotype_present';
            if (key.includes('phenotype') && key.includes('absent')) return 'phenotype_absent';
            if (key.includes('expression') && key.includes('present')) return 'expression_present';
            if (key.includes('expression') && key.includes('absent')) return 'expression_absent';
            if (key.includes('off') || key.includes('label')) return 'off_label_use';
            if (key.includes('parent') || key.includes('child')) return 'parent_child';
            if (key.includes('linked')) return 'linked_to';
            
            return 'default';
        };

        // 4. Update Links
        const link = g.select('.links-layer')
            .selectAll<SVGLineElement, SimLink>('line')
            .data(links, d => `${(d.source as any).id || d.source}-${(d.target as any).id || d.target}`)
            .join(
                enter => enter.append('line')
                    .attr('stroke', d => getEdgeColor(d.relation))
                    .attr('stroke-width', 1.5)
                    .attr('stroke-opacity', 0.4)
                    .attr('marker-end', d => `url(#arrowhead-${getEdgeColorKey(d.relation)})`),
                update => update,
                exit => exit.remove()
            );

        // 5. Update Link Labels
        const showLabels = !isMobile || links.length < 30;
        const linkLabel = g.select('.link-labels-layer')
            .selectAll<SVGTextElement, SimLink>('text')
            .data(showLabels ? links : [], d => `${(d.source as any).id || d.source}-${(d.target as any).id || d.target}`)
            .join(
                enter => enter.append('text')
                    .attr('font-size', '7px')
                    .attr('fill', darkMode ? '#94a3b8' : '#64748b')
                    .attr('text-anchor', 'middle')
                    .attr('opacity', 0.7)
                    .text(d => d.relation.length > 15 ? d.relation.slice(0, 15) + '...' : d.relation),
                update => update,
                exit => exit.remove()
            );

        // 6. Update Nodes
        const node = g.select('.nodes-layer')
            .selectAll<SVGGElement, SimNode>('g.node-group')
            .data(nodes, d => d.id)
            .join(
                enter => {
                    const nodeGroup = enter.append('g')
                        .attr('class', 'node-group')
                        .call(d3.drag<SVGGElement, SimNode>()
                            .on('start', (event, d) => {
                                if (!event.active) simulation.alphaTarget(0.3).restart();
                                d.fx = d.x;
                                d.fy = d.y;
                            })
                            .on('drag', (event, d) => {
                                d.fx = event.x;
                                d.fy = event.y;
                            })
                            .on('end', (event, d) => {
                                if (!event.active) simulation.alphaTarget(0);
                                d.fx = null;
                                d.fy = null;
                            })
                        )
                        .on('click', (event, d) => {
                            if (onNodeClick) {
                                event.stopPropagation();
                                onNodeClick(d);
                            }
                        })
                        .on('mouseover', (event, d) => setHoveredNode(d.id))
                        .on('mouseout', () => setHoveredNode(null));

                    nodeGroup.append('circle')
                        .attr('r', isMobile ? 10 : 12)
                        .attr('stroke-width', 2)
                        .style('cursor', 'pointer');

                    nodeGroup.append('text')
                        .attr('dx', isMobile ? 12 : 16)
                        .attr('dy', 4)
                        .attr('font-size', isMobile ? '8px' : '10px')
                        .attr('font-weight', '600')
                        .style('pointer-events', 'none');

                    return nodeGroup;
                },
                update => update,
                exit => exit.remove()
            );

        // Update node styles based on theme/data
        node.select('circle')
            .attr('fill', d => getNodeColor(d.type))
            .attr('stroke', 'rgb(var(--color-bg-main))')
            .style('filter', d => `drop-shadow(0 0 6px ${getNodeColor(d.type)}40)`);

        node.select('text')
            .attr('fill', 'rgb(var(--color-text-primary))')
            .text(d => d.name.length > 25 ? d.name.slice(0, 25) + '...' : d.name);

        // 7. Tick Handler
        simulation.on('tick', () => {
            link
                .attr('x1', d => (d.source as SimNode).x!)
                .attr('y1', d => (d.source as SimNode).y!)
                .attr('x2', d => (d.target as SimNode).x!)
                .attr('y2', d => (d.target as SimNode).y!);

            linkLabel
                .attr('x', d => ((d.source as SimNode).x! + (d.target as SimNode).x!) / 2)
                .attr('y', d => ((d.source as SimNode).y! + (d.target as SimNode).y!) / 2);

            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });

    }, [data, darkMode, dimensions]);

    // Highlight Effect (Separated for performance)
    useEffect(() => {
        if (!gRef.current) return;
        const g = gRef.current;
        const node = g.selectAll<SVGGElement, SimNode>('g.node-group');
        const link = g.selectAll<SVGLineElement, SimLink>('.links-layer line');
        const linkLabel = g.selectAll<SVGTextElement, SimLink>('.link-labels-layer text');

        const tDuration = 200;

        if (activeNodeId) {
            const connectedLinkNodes = new Set<string>();
            connectedLinkNodes.add(activeNodeId);

            link.each(function(d) {
                const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
                const targetId = typeof d.target === 'object' ? d.target.id : d.target;
                if (sourceId === activeNodeId || targetId === activeNodeId) {
                    connectedLinkNodes.add(sourceId as string);
                    connectedLinkNodes.add(targetId as string);
                }
            });

            node.transition().duration(tDuration)
                .attr('opacity', d => connectedLinkNodes.has(d.id) ? 1 : 0.1);

            link.transition().duration(tDuration)
                .attr('stroke-opacity', d => {
                    const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
                    const targetId = typeof d.target === 'object' ? d.target.id : d.target;
                    return (sourceId === activeNodeId || targetId === activeNodeId) ? 1 : 0.05;
                })
                .attr('stroke-width', d => {
                     const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
                     const targetId = typeof d.target === 'object' ? d.target.id : d.target;
                     return (sourceId === activeNodeId || targetId === activeNodeId) ? 2.5 : 1.5;
                });

            linkLabel.transition().duration(tDuration)
                .attr('opacity', d => {
                     const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
                     const targetId = typeof d.target === 'object' ? d.target.id : d.target;
                     return (sourceId === activeNodeId || targetId === activeNodeId) ? 1 : 0;
                });
            
            node.filter(d => d.id === activeNodeId).select('circle')
                .transition().duration(tDuration)
                .attr('stroke', '#fff')
                .attr('stroke-width', 3)
                .attr('r', 16);

        } else {
            node.transition().duration(tDuration).attr('opacity', 1);
            node.select('circle').transition().duration(tDuration)
                .attr('stroke', 'rgb(var(--color-bg-main))')
                .attr('stroke-width', 2)
                .attr('r', 12);

            link.transition().duration(tDuration)
                .attr('stroke-opacity', 0.4)
                .attr('stroke-width', 1.5);

            linkLabel.transition().duration(tDuration)
                .attr('opacity', 0.7);
        }
    }, [activeNodeId, darkMode]);

    // Zoom Controls
    const handleZoomIn = () => {
        if (svgRef.current && zoomRef.current) {
            d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.2);
        }
    };

    const handleZoomOut = () => {
        if (svgRef.current && zoomRef.current) {
            d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.8);
        }
    };

    const handleReset = () => {
        if (svgRef.current && zoomRef.current) {
            d3.select(svgRef.current).transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
        }
    };

    if (!data.nodes?.length) return null;

    return (
        <div
            ref={containerRef}
            className={`relative rounded-xl overflow-hidden border transition-all duration-300 bg-surface/50 border-border ${isFullscreen ? 'fixed inset-0 z-50 w-full h-full rounded-none' : `w-full h-full ${className}`}`}
            style={isFullscreen ? { height: '100vh', width: '100vw' } : { height: '100%', width: '100%' }}
        >
            {/* Floating Toolbar (Zoom/Fullscreen) */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <div className={`flex flex-col items-center gap-1 p-1 rounded-lg border backdrop-blur-md shadow-lg bg-surface/90 border-border`}>
                    <button onClick={handleZoomIn} className={`p-2 rounded-md transition-colors hover:bg-surface-hover text-tertiary hover:text-indigo-600`} title="Zoom In">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                    </button>
                    <button onClick={handleZoomOut} className={`p-2 rounded-md transition-colors hover:bg-surface-hover text-tertiary hover:text-indigo-600`} title="Zoom Out">
                        <span className="material-symbols-outlined text-[20px]">remove</span>
                    </button>
                    <div className={`w-4 h-px my-0.5 bg-border`}></div>
                    <button onClick={handleReset} className={`p-2 rounded-md transition-colors hover:bg-surface-hover text-tertiary hover:text-indigo-600`} title="Reset View">
                        <span className="material-symbols-outlined text-[20px]">center_focus_strong</span>
                    </button>
                </div>

                <button 
                    onClick={toggleFullscreen} 
                    className={`p-2 rounded-lg border backdrop-blur-md shadow-lg transition-all bg-surface/90 border-border text-tertiary hover:text-indigo-600 hover:bg-surface-hover`}
                    title="Toggle Fullscreen"
                >
                    <span className="material-symbols-outlined text-[20px]">
                        {isFullscreen ? 'close_fullscreen' : 'open_in_full'}
                    </span>
                </button>
            </div>

            {/* Legend Overlay */}
            <div className={`absolute bottom-4 left-4 z-10 flex flex-wrap gap-2 p-3 rounded-xl max-w-[90%] md:max-w-[70%] text-xs border backdrop-blur-md shadow-lg bg-surface/90 border-border`}>
                {Array.from(new Set(data.nodes.map(n => n.type))).sort().slice(0, 8).map(type => (
                    <div key={type} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: getNodeColor(type) }} />
                        <span className={`font-medium text-secondary`}>
                            {type.replace(/_/g, ' ')}
                        </span>
                    </div>
                ))}
            </div>

            {/* Hint Overlay */}
            <div className={`absolute bottom-4 right-4 z-10 text-[10px] px-3 py-1.5 rounded-full border backdrop-blur-sm pointer-events-none select-none bg-surface/60 border-border text-tertiary`}>
                Scroll to zoom • Drag to move
            </div>

            {/* D3 Canvas */}
            <svg
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
                className="w-full h-full block cursor-grab active:cursor-grabbing touch-none"
                style={{ background: 'transparent' }}
            />

            {/* Embedded Overlays (e.g. Inspector) */}
            {children}

        </div>
    );
});

export default GraphVisualization;
