/**
 * Tool Registry - Single Source of Truth
 * Maps UI tools to LLM prompts, API endpoints, and execution logic
 */

export interface ToolItem {
  id: string;
  label: string;
  icon: string;
  description: string;
  toolName: string; // Maps to LLM function name
  category: 'Search' | 'Graph Traversal' | 'Hypothesis Generation' | 'System' | 'Context';
  
  // Agent Prompt: Injected into LLM when tool is selected
  agentPrompt: string;
  
  // Manual Mode: Direct API call parameters
  manualInput?: string[];
  manualEndpoint?: string;
  
  // Template for input placeholder
  inputPlaceholder?: string;
}

export const toolRegistry: ToolItem[] = [
  // ===== SEARCH CATEGORY =====
  {
    id: 'textSearch',
    label: 'Text Entity Search',
    icon: 'manage_search',
    description: 'Exact or partial textual match',
    toolName: 'searchText',
    category: 'Search',
    agentPrompt: `You are in SEARCH mode. The user wants to find biomedical entities using text matching.
Use 'searchText' to find entities by exact or partial name.
If results are limited, suggest using semantic search instead.`,
    manualInput: ['query'],
    manualEndpoint: '/search/text',
    inputPlaceholder: 'Search for entity (e.g., "cancer", "insulin")...'
  },
  {
    id: 'semanticSearch',
    label: 'Semantic Search',
    icon: 'psychology',
    description: 'Find entities by meaning/embedding',
    toolName: 'searchSemantic',
    category: 'Search',
    agentPrompt: `You are in SEMANTIC SEARCH mode. This is the MANDATORY FIRST STEP for entity resolution.
Use 'searchSemantic' to find biomedical entities by meaning, not just keywords.
Examples: "breast ca" → "Breast Cancer", "aspirin" → "Aspirin", "p53" → "TP53".
Always ground vague user terms here before proceeding to other tools.`,
    manualInput: ['query'],
    manualEndpoint: '/search/semantic',
    inputPlaceholder: 'Search by concept (e.g., "cancer drugs", "brain proteins")...'
  },

  // ===== GRAPH TRAVERSAL CATEGORY =====
  {
    id: 'neighbors',
    label: 'Entity Relationships',
    icon: 'hub',
    description: 'Get immediate neighbors (1-hop)',
    toolName: 'getNeighbors',
    category: 'Graph Traversal',
    agentPrompt: `You are in ENTITY RELATIONSHIPS mode.
Use 'getNeighbors' to retrieve all direct connections (1-hop) for a biomedical entity.
Filter results for specific edge types:
- "treats" or "associated_with" for drug-disease
- "SIDE_EFFECT" or "CONTRAINDICATION" for safety queries
- "interacts_with" for protein interactions
Synthesize the neighborhood into a coherent explanation.`,
    manualInput: ['nodeId'],
    manualEndpoint: '/neighbors/{node_name}',
    inputPlaceholder: 'Enter entity name (e.g., "Metformin", "Alzheimer\'s disease")...'
  },
  {
    id: 'shortestPath',
    label: 'Find Paths',
    icon: 'route',
    description: 'Find connections between two entities',
    toolName: 'getShortestPath',
    category: 'Graph Traversal',
    agentPrompt: `You are in PATHFINDING mode.
Use 'getShortestPath' to find how two biomedical entities are connected.
MANDATORY: Use 'searchSemantic' FIRST to resolve both source and target to canonical names.
Example flow:
1. User: "How is Metformin connected to Alzheimer's?"
2. You: Call searchSemantic("Metformin") and searchSemantic("Alzheimer's")
3. You: Call getShortestPath("Drug:Metformin", "Disease:Alzheimer's_disease")
4. Explain the biological meaning of each edge in the path.`,
    manualInput: ['source', 'target'],
    manualEndpoint: '/path/{source}/{target}',
    inputPlaceholder: 'Enter source and target (e.g., "Metformin / Alzheimer\'s")...'
  },
  {
    id: 'subgraph',
    label: 'Extract Subgraph',
    icon: 'dataset',
    description: 'Visualize local network context',
    toolName: 'getSubgraph',
    category: 'Graph Traversal',
    agentPrompt: `You are in SUBGRAPH VISUALIZATION mode.
Use 'getSubgraph' to extract a neighborhood for visualization.
IMPORTANT: Do NOT dump the raw JSON to the user.
Instead:
1. Analyze the returned nodes and edges
2. Summarize: "Found X nodes and Y edges"
3. Describe key connections in plain language
4. The frontend will render the graph visualization.`,
    manualInput: ['entity'],
    manualEndpoint: '/subgraph/{entity}',
    inputPlaceholder: 'Enter entity to visualize (e.g., "TP53")...'
  },

  // ===== HYPOTHESIS GENERATION CATEGORY =====
  {
    id: 'repurposing',
    label: 'Drug Repurposing',
    icon: 'medication_liquid',
    description: 'Find drugs for a disease',
    toolName: 'getDrugRepurposing',
    category: 'Hypothesis Generation',
    agentPrompt: `You are in DRUG REPURPOSING mode - discovery for new therapeutic applications.
Execution flow:
1. MANDATORY: Use 'searchSemantic' to resolve the disease name to canonical form
2. Use 'getDrugRepurposing' with the resolved disease
3. Interpret the results:
   - Rank candidates by score/confidence
   - Explain why each drug might work (shared targets, similar pathways)
   - Highlight novelty (non-obvious connections)
4. Conclude with actionable recommendations`,
    manualInput: ['disease'],
    manualEndpoint: '/hypothesis/repurposing/{disease}',
    inputPlaceholder: 'Enter disease name (e.g., "Glioblastoma", "Type 2 Diabetes")...'
  },
  {
    id: 'targets',
    label: 'Therapeutic Targets',
    icon: 'target',
    description: 'Find gene/protein targets',
    toolName: 'getTherapeuticTargets',
    category: 'Hypothesis Generation',
    agentPrompt: `You are in THERAPEUTIC TARGET DISCOVERY mode.
Execution flow:
1. MANDATORY: Use 'searchSemantic' to resolve the disease name
2. Use 'getTherapeuticTargets' to identify druggable gene/protein targets
3. Analyze and explain:
   - Why each target is relevant to the disease
   - Existing drugs that target these proteins (if available)
   - Druggability scores or accessibility
4. Rank targets by impact and feasibility`,
    manualInput: ['disease'],
    manualEndpoint: '/hypothesis/targets/{disease}',
    inputPlaceholder: 'Enter disease name (e.g., "Parkinson\'s Disease")...'
  },
  {
    id: 'combinations',
    label: 'Drug Combinations',
    icon: 'science',
    description: 'Find synergistic drug pairs',
    toolName: 'getDrugCombinations',
    category: 'Hypothesis Generation',
    agentPrompt: `You are in DRUG COMBINATION DISCOVERY mode.
Execution flow:
1. MANDATORY: Use 'searchSemantic' to resolve the primary drug name
2. Use 'getDrugCombinations' to find potential synergistic partners
3. Interpret synergy:
   - Complementary targets
   - Reduced side effects
   - Enhanced efficacy through pathway interactions
4. Provide clinical rationale for recommended combinations`,
    manualInput: ['drug'],
    manualEndpoint: '/hypothesis/combinations/{drug}',
    inputPlaceholder: 'Enter drug name (e.g., "Aspirin", "Metformin")...'
  },
  {
    id: 'mechanism',
    label: 'Mechanism of Action',
    icon: 'lightbulb',
    description: 'Explain drug-disease mechanism',
    toolName: 'getMechanism',
    category: 'Hypothesis Generation',
    agentPrompt: `You are in MECHANISTIC EXPLANATION mode - deep biological reasoning.
Execution flow:
1. MANDATORY: Use 'searchSemantic' to resolve BOTH drug and disease names
2. Use 'getMechanism' to retrieve the connection pathways
3. Trace the biological route: Drug → Protein Target → Pathway → Disease Effect
4. Explain each edge in the path:
   - Drug-Protein binding (binding affinity if available)
   - Protein-Pathway interactions
   - Pathway-Disease relevance
5. Cite specific relationship types from the graph
6. Provide a coherent narrative explaining WHY this mechanism works`,
    manualInput: ['drug', 'disease'],
    manualEndpoint: '/hypothesis/mechanisms/{drug}/{disease}',
    inputPlaceholder: 'Enter drug and disease (e.g., "Aspirin / Stroke")...'
  },

  // ===== SYSTEM CATEGORY (NO LLM ACCESS) =====
  {
    id: 'health',
    label: 'API Health Check',
    icon: 'monitor_heart',
    description: 'Check if API and Neo4j are online',
    toolName: 'getHealth',
    category: 'System',
    agentPrompt: '', // Not used; handled directly by frontend
    manualEndpoint: '/health'
  },
  {
    id: 'stats',
    label: 'Graph Statistics',
    icon: 'bar_chart',
    description: 'View node and edge distribution counts',
    toolName: 'getStats',
    category: 'System',
    agentPrompt: '', // Not used; handled directly by frontend
    manualEndpoint: '/stats'
  },

  // ===== CONTEXT CATEGORY =====
  {
    id: 'context',
    label: 'Module Context',
    icon: 'info',
    description: 'Get MCP server context',
    toolName: 'getContext',
    category: 'Context',
    agentPrompt: `You are accessing MODULE CONTEXT.
This provides metadata about available endpoints and capabilities.
Use this for informational queries only.`,
    manualEndpoint: '/context'
  },
  {
    id: 'schema',
    label: 'Tool Schema',
    icon: 'code',
    description: 'View available tool definitions',
    toolName: 'getToolSchema',
    category: 'Context',
    agentPrompt: `You are accessing TOOL SCHEMA.
This provides the OpenAPI/Function Calling definitions.
Reference this for technical documentation.`,
    manualEndpoint: '/tools/schema'
  }
];

/**
 * Get tool by ID
 */
export const getTool = (toolId: string): ToolItem | undefined => {
  return toolRegistry.find(t => t.id === toolId);
};

/**
 * Get tools by category
 */
export const getToolsByCategory = (category: ToolItem['category']): ToolItem[] => {
  return toolRegistry.filter(t => t.category === category);
};

/**
 * System functions that BYPASS the LLM (direct API calls)
 */
export const systemTools = ['health', 'stats'];

/**
 * Get dynamic system prompt based on selected tool
 */
export const getToolSpecificPrompt = (toolId: string, basePrompt: string): string => {
  const tool = getTool(toolId);
  if (!tool || !tool.agentPrompt) return basePrompt;
  
  return `${basePrompt}

## ACTIVE TOOL: ${tool.label.toUpperCase()}
${tool.agentPrompt}`;
};
