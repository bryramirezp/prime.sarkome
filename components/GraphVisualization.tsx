import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { GraphData, KGNode, KGEdge } from '../types';

interface GraphVisualizationProps {
    data: GraphData;
    darkMode?: boolean;
    width?: number;
    height?: number;
    className?: string;
}

// Normalized node color palette
const nodeColors: Record<string, string> = {
    disease: '#ef4444',       // Red
    drug: '#3b82f6',          // Blue
    gene_protein: '#22c55e',  // Green
    gene: '#22c55e',          // Green
    protein: '#10b981',       // Emerald
    pathway: '#f59e0b',       // Amber
    anatomy: '#8b5cf6',       // Violet
    biological_process: '#06b6d4', // Cyan
    molecular_function: '#ec4899', // Pink
    cellular_component: '#14b8a6', // Teal
    phenotype: '#f97316',     // Orange
    exposure: '#6366f1',      // Indigo
    default: '#64748b'        // Slate
};

function getNodeColor(type: string): string {
    const normalizedType = type?.toLowerCase().replace(/[\/\s]/g, '_') || 'default';
    return nodeColors[normalizedType] || nodeColors.default;
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

export default function GraphVisualization({
    data,
    darkMode = true,
    width = 600,
    height = 400,
    className = ""
}: GraphVisualizationProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

    // State for UI/UX
    const [dimensions, setDimensions] = useState({ width, height });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);

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
            // Fallback to CSS fullscreen
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

    // Effect to handle native fullscreen change events (ESC key)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Main D3 Effect
    useEffect(() => {
        if (!svgRef.current || !data.nodes?.length) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const { width: w, height: h } = dimensions;

        // Detect Mobile for Optimizations
        const isMobile = w < 768;

        // Initialize Zoom
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
                setZoomLevel(event.transform.k);
            });

        zoomRef.current = zoom;
        svg.call(zoom);

        // Main group
        const g = svg.append('g');

        // Arrow Marker
        svg.append('defs').append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 22) // Adjusted for node radius (12 + padding)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .append('path')
            .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
            .attr('fill', darkMode ? '#64748b' : '#94a3b8');

        // Prepare Data
        // Optimization: Limit nodes on mobile if too many
        let renderNodes = data.nodes;
        let renderEdges = data.edges;

        if (isMobile && data.nodes.length > 50) {
            renderNodes = data.nodes.slice(0, 50);
            renderEdges = data.edges.filter(e =>
                renderNodes.some(n => n.id === e.source) &&
                renderNodes.some(n => n.id === e.target)
            );
        }

        const nodes: SimNode[] = renderNodes.map(n => ({ ...n }));
        const links: SimLink[] = renderEdges.map(e => ({ ...e }));

        // Force Simulation - Optimized for Mobile
        const simulation = d3.forceSimulation<SimNode>(nodes)
            .force('link', d3.forceLink<SimNode, SimLink>(links).id(d => d.id).distance(isMobile ? 80 : 120))
            .force('charge', d3.forceManyBody().strength(isMobile ? -200 : -400))
            .force('center', d3.forceCenter(w / 2, h / 2))
            .force('collide', d3.forceCollide().radius(isMobile ? 30 : 40).strength(0.5));

        // Mobile optimizations: Settle faster to save battery/CPU
        if (isMobile) {
            simulation.alphaDecay(0.05).velocityDecay(0.4);
        }

        // Draw Links
        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke', darkMode ? '#475569' : '#cbd5e1')
            .attr('stroke-width', isMobile ? 1 : 1.5)
            .attr('stroke-opacity', 0.6)
            .attr('marker-end', 'url(#arrowhead)');

        // Link Labels (Relation) - Hide on mobile if too many links
        let linkLabel;
        if (!isMobile || links.length < 30) {
            linkLabel = g.append('g')
                .attr('class', 'link-labels')
                .selectAll('text')
                .data(links)
                .join('text')
                .attr('font-size', '8px')
                .attr('fill', darkMode ? '#94a3b8' : '#64748b')
                .attr('text-anchor', 'middle')
                .text(d => d.relation.length > 15 ? d.relation.slice(0, 15) + '...' : d.relation);
        }

        // Draw Nodes
        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(nodes)
            .join('g')
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
            );

        // Node Circle
        node.append('circle')
            .attr('r', isMobile ? 10 : 12)
            .attr('fill', d => getNodeColor(d.type))
            .attr('stroke', darkMode ? '#1e293b' : '#ffffff')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer');

        // Node Label
        node.append('text')
            .attr('dx', isMobile ? 12 : 16)
            .attr('dy', 4)
            .attr('font-size', isMobile ? '8px' : '10px')
            .attr('font-weight', '500')
            .attr('fill', darkMode ? '#e2e8f0' : '#1e293b')
            .text(d => d.name.length > 25 ? d.name.slice(0, 25) + '...' : d.name);

        // Hover Effect - Simplified for Mobile
        node.on('mouseover', (event, d) => {
            setHoveredNode(d.id);

            // Highlight connections
            // Use lighter transitions or none on mobile
            const tDuration = isMobile ? 0 : 200;

            link
                .transition().duration(tDuration)
                .attr('stroke', l => (l.source as SimNode).id === d.id || (l.target as SimNode).id === d.id ? (darkMode ? '#fff' : '#000') : (darkMode ? '#475569' : '#cbd5e1'))
                .attr('stroke-opacity', l => (l.source as SimNode).id === d.id || (l.target as SimNode).id === d.id ? 1 : 0.1);

            if (linkLabel) {
                linkLabel
                    .transition().duration(tDuration)
                    .attr('opacity', l => (l.source as SimNode).id === d.id || (l.target as SimNode).id === d.id ? 1 : 0.1);
            }

            node
                .transition().duration(tDuration)
                .attr('opacity', n => n.id === d.id || links.some(l =>
                    ((l.source as SimNode).id === d.id && (l.target as SimNode).id === n.id) ||
                    ((l.target as SimNode).id === d.id && (l.source as SimNode).id === n.id)
                ) ? 1 : 0.2);

            d3.select(event.currentTarget).select('circle')
                .transition().duration(tDuration)
                .attr('r', isMobile ? 14 : 16)
                .attr('stroke', darkMode ? '#fff' : '#000');
        })
            .on('mouseout', (event, d) => {
                setHoveredNode(null);

                const tDuration = isMobile ? 0 : 200;

                // Reset styles
                link
                    .transition().duration(tDuration)
                    .attr('stroke', darkMode ? '#475569' : '#cbd5e1')
                    .attr('stroke-opacity', 0.6);

                if (linkLabel) {
                    linkLabel
                        .transition().duration(tDuration)
                        .attr('opacity', 1);
                }

                node
                    .transition().duration(tDuration)
                    .attr('opacity', 1);

                d3.select(event.currentTarget).select('circle')
                    .transition().duration(tDuration)
                    .attr('r', isMobile ? 10 : 12)
                    .attr('stroke', darkMode ? '#1e293b' : '#ffffff');
            });

        // Tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => (d.source as SimNode).x!)
                .attr('y1', d => (d.source as SimNode).y!)
                .attr('x2', d => (d.target as SimNode).x!)
                .attr('y2', d => (d.target as SimNode).y!);

            if (linkLabel) {
                linkLabel
                    .attr('x', d => ((d.source as SimNode).x! + (d.target as SimNode).x!) / 2)
                    .attr('y', d => ((d.source as SimNode).y! + (d.target as SimNode).y!) / 2);
            }



            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        return () => {
            simulation.stop();
        };
    }, [data, dimensions, darkMode]);

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
            className={`relative rounded-xl overflow-hidden border transition-all duration-300 ${darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-200'
                } ${isFullscreen ? 'fixed inset-0 z-50 w-full h-full rounded-none' : `w-full h-full ${className}`}`}
            style={isFullscreen ? { height: '100vh', width: '100vw' } : { height: height || 400 }}
        >
            {/* Header / Toolbar */}
            <div className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 ${darkMode ? 'bg-zinc-900/80' : 'bg-white/80'
                } backdrop-blur-md border-b ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>

                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                        <span className="material-symbols-outlined text-[18px] block">hub</span>
                    </div>
                    <div>
                        <div className={`text-xs font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Knowledge Graph</div>
                        <div className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {data.nodes.length} nodes • {data.edges.length} edges
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-surface/50 rounded-lg p-1 border border-border/50">
                    <button onClick={handleZoomOut} className="p-1.5 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors" title="Zoom Out">
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                    <button onClick={handleReset} className="p-1.5 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors" title="Reset View">
                        <span className="material-symbols-outlined text-[18px]">center_focus_strong</span>
                    </button>
                    <button onClick={handleZoomIn} className="p-1.5 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors" title="Zoom In">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                    <div className="w-px h-4 bg-border mx-1"></div>
                    <button onClick={toggleFullscreen} className="p-1.5 hover:bg-surface-hover rounded text-secondary hover:text-primary transition-colors" title="Toggle Fullscreen">
                        <span className="material-symbols-outlined text-[18px]">
                            {isFullscreen ? 'close_fullscreen' : 'open_in_full'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Legend Overlay */}
            <div className={`absolute bottom-4 left-4 z-10 flex flex-wrap gap-2 p-3 rounded-xl max-w-[90%] md:max-w-[70%] text-xs border backdrop-blur-md shadow-lg ${darkMode ? 'bg-zinc-900/90 border-zinc-700/50' : 'bg-white/90 border-slate-200'
                }`}>
                {Array.from(new Set(data.nodes.map(n => n.type))).sort().slice(0, 8).map(type => (
                    <div key={type} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: getNodeColor(type) }} />
                        <span className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {type.replace(/_/g, ' ')}
                        </span>
                    </div>
                ))}
            </div>

            {/* Hint Overlay */}
            <div className={`absolute bottom-4 right-4 z-10 text-[10px] px-3 py-1.5 rounded-full border backdrop-blur-sm pointer-events-none select-none ${darkMode ? 'bg-zinc-900/60 border-zinc-800 text-slate-500' : 'bg-white/60 border-slate-200 text-slate-400'
                }`}>
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

        </div>
    );
}
