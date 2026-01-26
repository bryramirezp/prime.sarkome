import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { GeminiModel, GraphData } from '../types';
import { ChatSession, ChatMessage } from '../schemas/sessionSchema';
import { generateResponse } from '../services/geminiService';
import { kgService } from '../services/kgService';
import ApiKeyModal, { getStoredApiKey } from './ApiKeyModal';
import { toolRegistry, getTool, getToolSpecificPrompt, systemTools } from '../constants/toolRegistry';
import type { ToolItem } from '../constants/toolRegistry';
// Lazy load heavy graph visualization component for better initial load performance
const GraphVisualization = React.lazy(() => import('./GraphVisualization'));
import { CostTracker, calculateCost } from './CostTracker';
import SuggestedQuestions from './SuggestedQuestions';
import ToolExecutionChips from './ToolExecutionChips';
import HypothesisCards from './HypothesisCards';
import EntityMention from './EntityMention';
import MermaidDiagram from './MermaidDiagram';

// Model icon component
const ModelIcon: React.FC<{ model: GeminiModel; className?: string }> = ({ model, className = "w-4 h-4" }) => {
  if (model === GeminiModel.FLASH) {
    // Flash: Lightning bolt style
    return <span className="material-symbols-outlined">bolt</span>;
  }
  // Pro: Psychology/brain style
  return <span className="material-symbols-outlined">psychology</span>;
};


const inferNodeType = (edge: any, isSource: boolean): string => {
  // 1. Try explicit type fields if available (API might return them)
  // Normalize API types to Title Case (e.g. "disease" -> "Disease")
  const type = isSource ? edge.source_type : edge.target_type;
  if (type) {
    if (type.toLowerCase() === 'geneprotein') return 'GeneProtein';
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  // 2. Infer from known relation semantics (PrimeKG rules)
  const rel = (edge.relation || '').toLowerCase();
  const otherType = (isSource ? (edge.target_type || '') : (edge.source_type || '')).toLowerCase();

  // Indication: Drug <-> Disease
  if (rel === 'indication' || rel === 'contraindication' || rel === 'off_label_use') {
    if (otherType.includes('drug')) return 'Disease';
    if (otherType.includes('disease')) return 'Drug';
  }

  // Drug Targets: Drug -> Gene/Protein
  if (rel === 'target' || rel === 'transporter' || rel === 'enzyme' || rel === 'carrier') {
    if (isSource) return 'Drug';
    return 'GeneProtein';
  }

  // Synergistic interaction: Drug <-> Drug
  if (rel === 'synergistic_interaction') {
    return 'Drug';
  }

  // PPI: Protein <-> Protein
  if (rel === 'ppi') {
    return 'GeneProtein';
  }

  // Disease-Phenotype
  if (rel.includes('phenotype')) {
    if (otherType.includes('disease')) return 'Phenotype';
    return 'Disease';
  }
  
  return 'Unknown';
};



// Utility to extract graph data from tool results
const extractGraphData = (toolResults: Array<{ name: string; args: any; result: any }> | undefined): GraphData | undefined => {
  if (!toolResults || toolResults.length === 0) return undefined;

  const graphNodes: any[] = [];
  const graphEdges: any[] = [];
  const seenNodeIds = new Set<string>();
  const seenEdgeKeys = new Set<string>();

  for (const tr of toolResults) {
    const data = typeof tr.result === 'string' ? JSON.parse(tr.result) : tr.result;
    if (!data) continue;

    // Handle getNeighbors response (array of EdgeItem)
    if (Array.isArray(data) && data.length > 0 && data[0].source && data[0].target && data[0].relation) {
      // This is an array of edges from getNeighbors
      for (const edge of data) {
        // Add source node
        if (edge.source && !seenNodeIds.has(edge.source)) {
          seenNodeIds.add(edge.source);
          graphNodes.push({
            id: edge.source,
            name: edge.source,
            type: inferNodeType(edge, true)
          });
        }

        // Add target node
        if (edge.target && !seenNodeIds.has(edge.target)) {
          seenNodeIds.add(edge.target);
          graphNodes.push({
            id: edge.target,
            name: edge.target,
            type: inferNodeType(edge, false)
          });
        }

        // Add edge
        if (edge.source && edge.target) {
          const edgeKey = `${edge.source}-${edge.relation}-${edge.target}`;
          if (!seenEdgeKeys.has(edgeKey)) {
            seenEdgeKeys.add(edgeKey);
            graphEdges.push({
              source: edge.source,
              target: edge.target,
              relation: edge.relation || 'related_to'
            });
          }
        }
      }
      continue; // Skip to next tool result
    }

    // Handle standard GraphData response (nodes + edges)
    if (data.nodes && Array.isArray(data.nodes)) {
      for (const node of data.nodes) {
        const nodeId = node.name || node.id || node.db_id || node.node_id;
        if (nodeId && !seenNodeIds.has(nodeId)) {
          seenNodeIds.add(nodeId);
          graphNodes.push({
            id: nodeId,
            name: node.name || nodeId,
            type: node.type ? (node.type.toLowerCase() === 'geneprotein' ? 'GeneProtein' : node.type.charAt(0).toUpperCase() + node.type.slice(1)) : 'Unknown',
            ...node
          });
        }
      }
    }

    if (data.edges && Array.isArray(data.edges)) {
      for (const edge of data.edges) {
        const source = edge.source;
        const target = edge.target;
        if (source && target) {
          const edgeKey = `${source}-${edge.relation}-${target}`;
          if (!seenEdgeKeys.has(edgeKey)) {
            seenEdgeKeys.add(edgeKey);
            graphEdges.push({
              source: source,
              target: target,
              relation: edge.relation || 'related_to'
            });
          }
        }
      }
    }
  }

  const MAX_NODES = 100;
  const MAX_EDGES = 200;
  let processedNodes = graphNodes;
  let processedEdges = graphEdges;
  let isTruncated = false;

  if (graphNodes.length > MAX_NODES) {
    processedNodes = graphNodes.slice(0, MAX_NODES);
    processedEdges = graphEdges.filter(e =>
      processedNodes.some(n => n.id === e.source) &&
      processedNodes.some(n => n.id === e.target)
    ).slice(0, MAX_EDGES);
    isTruncated = true;
  }

  if (processedNodes.length > 0) {
    return {
      nodes: processedNodes,
      edges: processedEdges,
      isTruncated
    } as GraphData;
  }
  return undefined;
};

interface ChatInterfaceProps {
  /** Current active chat session */
  currentSession: ChatSession | null;
  /** Callback to save session messages */
  onSaveSession: (messages: ChatMessage[]) => void;
  /** Whether API is offline */
  isOffline?: boolean;
  /** Current dark mode state */
  darkMode?: boolean;
  /** Currently selected AI model */
  selectedModel: GeminiModel;
}

/**
 * Chat interface component - handles message display and input.
 * Header and sidebar are now managed by the Layout component.
 */
const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentSession,
  onSaveSession,
  isOffline = false,
  darkMode = false,
  selectedModel,
}) => {
  const markdownComponents = {
    table: ({ children }: any) => (
      <div className="w-full overflow-x-auto">
        <table className="w-full text-xs sm:text-sm border-collapse text-foreground">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-muted text-muted-foreground font-medium">{children}</thead>
    ),
    th: ({ children }: any) => (
      <th className="text-left font-semibold px-3 py-2 border border-border text-foreground">{children}</th>
    ),
    td: ({ children }: any) => (
      <td className="align-top px-3 py-2 border border-border text-foreground">{children}</td>
    ),
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const content = String(children).replace(/\n$/, '');
      
      // Check for mermaid explicitly or by content heuristic
      const isMermaid = match && match[1] === 'mermaid';
      const isMermaidHeuristic = !inline && (
        content.trim().startsWith('graph ') || 
        content.trim().startsWith('sequenceDiagram') ||
        content.trim().startsWith('gantt') ||
        content.trim().startsWith('classDiagram') ||
        content.trim().startsWith('pie') ||
        content.trim().startsWith('flowchart')
      );

      if (!inline && (isMermaid || isMermaidHeuristic)) {
        return <MermaidDiagram code={content} darkMode={darkMode} />;
      }
      
      return (
        <code 
          className={match 
            ? "px-1 py-0.5 rounded bg-muted text-foreground font-mono text-[0.9em] block whitespace-pre overflow-x-auto" 
            : "px-1 py-0.5 rounded bg-muted text-foreground font-mono text-[0.9em]"}
          {...props}
        >
          {children}
        </code>
      );
    },
    a: ({ href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-primary font-medium text-primary/80 transition-colors"
      >
        {children}
        <span className="material-symbols-outlined text-[10px] ml-0.5 inline-block align-top">open_in_new</span>
      </a>
    ),
  };

  const welcomeMessage: ChatMessage = {
    id: 'welcome',
    role: 'system' as const,
    content: "Welcome to PrimeKG Explorer! I'm PrimeAI, your precision medicine assistant.\n\n🔑 **To start**, set your Google Gemini API key using the **⚙️ API Key** button above.\n\nI can analyze diseases, suggest drug repurposing candidates, and visualize molecular mechanisms. How can I help today?",
    timestamp: new Date()
  };

  const [messages, setMessages] = useState<ChatMessage[]>(currentSession?.messages || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Cost Tracking State
  const [currentUsage, setCurrentUsage] = useState<{ promptTokens: number; completionTokens: number; model: string } | undefined>(undefined);
  const [sessionTotal, setSessionTotal] = useState({ queries: 0, totalCost: 0 });

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showEnhancerSettings, setShowEnhancerSettings] = useState(false);
  const [showEnhancerTooltip, setShowEnhancerTooltip] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; data: string; mimeType: string; type: 'pdf' | 'image' | 'audio' | 'video' | 'text'; size: number }>>([]);
  const [liveTrace, setLiveTrace] = useState<string[]>([]);
  const [isTraceCollapsed, setIsTraceCollapsed] = useState(false);

  // Feature Toggles (Optimization)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [autoSearchEnabled, setAutoSearchEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('primekg_auto_search');
      return stored !== 'false'; // Default: true
    }
    return true;
  });

  // Persist auto-search preference
  useEffect(() => {
    localStorage.setItem('primekg_auto_search', String(autoSearchEnabled));
  }, [autoSearchEnabled]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [enhancerPrompt, setEnhancerPrompt] = useState(localStorage.getItem('primekg_enhancer_prompt') || `You are a prompt engineering expert. Your task is to enhance user prompts for a precision medicine AI assistant called PrimeAI that queries the PrimeKG knowledge graph.

PrimeAI capabilities:
- **Text & Semantic Search**: Search diseases, drugs, genes, proteins in PrimeKG (129k nodes, 8M+ relationships) using text matching or AI-powered semantic search with Google Gemini embeddings
- **RAG (Retrieval Augmented Generation)**: Combine knowledge graph queries with semantic retrieval for context-aware answers
- **Drug Repurposing**: Find candidates for new diseases
- **Therapeutic Targets**: Identify genes/proteins for drug development
- **Drug Synergy**: Explore combinations and complementary pathways
- **Molecular Mechanisms**: Trace Drug → Protein → Pathway → Disease routes
- **Graph Visualization**: Subgraphs and shortest paths between entities

Enhance the user's prompt by adding:
1. **ROLE**: Define PrimeAI as a precision medicine research assistant
2. **TASK**: Clarify the specific analysis or query needed
3. **REFERENCES**: Mention relevant entities, pathways, or literature if applicable
4. **OUTPUT FORMAT**: Specify how results should be structured (graph, table, narrative, etc.)

Keep the enhanced prompt concise but comprehensive. Output ONLY the enhanced prompt, nothing else.`);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handler to explore a node from the chat (entity mentions or hypothesis cards)
  const handleExploreNode = async (nodeName: string) => {
    const query = `Show me the network and connections for ${nodeName}. Include its neighbors, relationships, and any relevant pathways.`;
    executeChat(query);
  };

  const handleNodeClick = (node: any) => {
    // Populate input with context about the selected node
    const contextPrefix = `Tell me more about ${node.name} (${node.type}) and its `;
    setInput(contextPrefix);
    
    // Focus the textarea
    if (textareaRef.current) {
        textareaRef.current.focus();
    }
  };

  // Check for existing API key on mount
  useEffect(() => {
    const key = getStoredApiKey();
    setHasApiKey(!!key);
  }, []);

  // Sync with currentSession
  useEffect(() => {
    if (currentSession) {
      setMessages(currentSession.messages);
    } else {
      const apiKey = getStoredApiKey();
      setMessages(apiKey ? [] : [welcomeMessage]);
    }
  }, [currentSession]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to get proper scrollHeight
    textarea.style.height = 'auto';

    // Calculate new height (max 2x the initial height = 104px)
    const newHeight = Math.min(textarea.scrollHeight, 104);
    textarea.style.height = `${newHeight}px`;
  }, [input]);

  const getAutoTaskInstruction = (tool: ToolItem, promptText: string) => {
    switch (tool.id) {
      case 'getNeighbors':
        return `Get 1-hop neighbors for the main entity mentioned in: "${promptText}".`;
      case 'getSubgraph':
        return `Get a subgraph for the main entity mentioned in: "${promptText}".`;
      case 'getShortestPath':
        return `Find the shortest path between two entities mentioned in: "${promptText}". If only one entity is present, skip this.`;
      case 'getDrugRepurposing':
        return `Find potential drug repurposing candidates for the disease mentioned in: "${promptText}".`;
      case 'getTherapeuticTargets':
        return `Identify therapeutic targets for the disease mentioned in: "${promptText}".`;
      case 'getDrugCombinations':
        return `Find potential synergistic drug combinations for the drug mentioned in: "${promptText}".`;
      case 'getDrugMechanism':
        return `Explain the mechanism of action between the drug and disease mentioned in: "${promptText}".`;
      default:
        return `${tool.description} for: "${promptText}".`;
    }
  };

  const executeChat = async (promptText: string, options?: { skipAutoTasks?: boolean }) => {
    const autoTaskInstructions: string[] = [];

    if (!options?.skipAutoTasks) {
      if (autoSearchEnabled && !webSearchEnabled) {
        // If enabled, suggest semantic search for better grounding
        autoTaskInstructions.push(`If entities are mentioned, use searchSemantic to resolve them before other operations.`);
      } else {
        // If disabled, just pass the prompt raw, but still allow tool use if the model decides
        // (No forced instructions)
      }
    }

    const finalPrompt = autoTaskInstructions.length > 0
      ? `${promptText}\n\nAUTO-RUN TASKS (use tools):\n- ${autoTaskInstructions.join('\n- ')}`
      : promptText;

    const displayContent = uploadedFiles.length > 0
      ? `${promptText}\n\n📎 Attached: ${uploadedFiles.map(f => f.name).join(', ')}`
      : promptText;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: displayContent,
      timestamp: new Date(),
      relatedData: uploadedFiles.length > 0 ? { files: uploadedFiles } : undefined
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);
    setLiveTrace([]);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const history = newMessages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }));

      const trace: string[] = [];
      const pushTrace = (entry: string) => {
        trace.push(entry);
        setLiveTrace([...trace]);
      };

      const response = await generateResponse(
        finalPrompt,
        history,
        selectedModel,
        undefined,
        uploadedFiles.length > 0 ? uploadedFiles.map(f => ({
          name: f.name,
          data: f.data,
          mimeType: f.mimeType
        })) : undefined,
        pushTrace,
        controller.signal,
        { enableWebSearch: webSearchEnabled }
      );

      const graphData = extractGraphData(response.data);

      // Extract hypothesis data (repurposing, targets, combinations)
      let hypothesisData: any = undefined;
      if (response.data && Array.isArray(response.data)) {
        // Check if this is hypothesis data by looking at the tool names
        const toolNames = response.data.map((t: any) => t.name);

        if (toolNames.includes('getDrugRepurposing')) {
          const repurposingResult = response.data.find((t: any) => t.name === 'getDrugRepurposing');
          if (repurposingResult?.result?.candidates || Array.isArray(repurposingResult?.result)) {
            hypothesisData = {
              type: 'repurposing',
              data: repurposingResult.result.candidates || repurposingResult.result
            };
          }
        } else if (toolNames.includes('getTherapeuticTargets')) {
          const targetsResult = response.data.find((t: any) => t.name === 'getTherapeuticTargets');
          if (targetsResult?.result?.targets || Array.isArray(targetsResult?.result)) {
            hypothesisData = {
              type: 'targets',
              data: targetsResult.result.targets || targetsResult.result
            };
          }
        } else if (toolNames.includes('getDrugCombinations')) {
          const combosResult = response.data.find((t: any) => t.name === 'getDrugCombinations');
          if (combosResult?.result?.combinations || Array.isArray(combosResult?.result)) {
            hypothesisData = {
              type: 'combinations',
              data: combosResult.result.combinations || combosResult.result
            };
          }
        }
      }

      // Update Cost Tracking
      if (response.usage) {
        const usage = {
          promptTokens: response.usage.promptTokens,
          completionTokens: response.usage.completionTokens,
          model: selectedModel
        };
        setCurrentUsage(usage);

        const cost = calculateCost(selectedModel, usage.promptTokens, usage.completionTokens);
        setSessionTotal(prev => ({
          queries: prev.queries + 1,
          totalCost: prev.totalCost + cost
        }));
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.text,
        timestamp: new Date(),
        relatedData: (graphData && graphData.nodes && graphData.nodes.length > 0)
          ? graphData
          : hypothesisData
            ? hypothesisData
            : undefined,
        trace
      };

      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);
      onSaveSession(finalMessages);
      setLiveTrace([]);
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message === 'Aborted') {
        const abortedMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'model',
          content: "⏹️ *Generation stopped by user.*",
          timestamp: new Date(),
          isError: true,
          trace: liveTrace.length > 0 ? liveTrace : undefined
        };
        const finalMessages = [...newMessages, abortedMsg];
        setMessages(finalMessages);
        onSaveSession(finalMessages);
      } else {
        const errorMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'model',
          content: "I apologize, but I encountered an error communicating with the Knowledge Graph.",
          timestamp: new Date(),
          isError: true,
          trace: liveTrace.length > 0 ? liveTrace : undefined
        };
        const finalMessages = [...newMessages, errorMsg];
        setMessages(finalMessages);
        onSaveSession(finalMessages);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleTaskSelect = (task: ToolItem) => {
    // If it's a system tool (health, stats), handle directly without LLM
    if (systemTools.includes(task.id)) {
      handleSystemTool(task);
      return;
    }

    // Inject tool-specific prompt
    // Get the tool-specific system prompt
    const toolSpecificPrompt = getToolSpecificPrompt(task.id, '');

    // Store in sessionStorage for geminiService to use
    sessionStorage.setItem('activeTool', task.id);
    sessionStorage.setItem('toolContext', toolSpecificPrompt);

    // Optionally show feedback to user
    const feedback = `🛠️ Tool activated: **${task.label}**\n\n${task.inputPlaceholder || 'Enter your query...'}`;
    setInput(feedback);

    // Focus input for immediate typing
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      textarea?.focus();
    }, 100);
  };

  const handleSystemTool = async (tool: ToolItem) => {
    try {
      if (tool.id === 'health') {
        const result = await kgService.getHealth() as any;
        const status = result?.status === 'online' ? 'API Online' : 'API Offline';
        const neo4jStatus = result?.neo4j === 'connected' ? 'Neo4j Connected' : 'Neo4j Disconnected';
        showToast(`${status} | ${neo4jStatus}`);
      } else if (tool.id === 'stats') {
        const stats = await kgService.getStats() as any;
        const message = `Graph Stats:\n- Nodes: ${stats?.node_count || 'N/A'}\n- Edges: ${stats?.edge_count || 'N/A'}`;
        showToast(message);
      }
    } catch (error) {
      showToast('Failed to fetch system info', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'error') {
      toast.error(message);
    } else {
      toast.success(message);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    executeChat(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEnhancePrompt = async () => {
    if (!input.trim() || isEnhancing) return;

    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    const originalInput = input;
    setIsEnhancing(true);

    // Show "improving" indicator in textarea
    setInput('Improving your 🐮 prompt...');

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp', // Free experimental version
        contents: `${enhancerPrompt}\n\nUser prompt to enhance:\n"${originalInput}"`
      });

      const enhanced = response.text?.trim();
      if (enhanced) {
        setInput(enhanced);
      } else {
        setInput(originalInput);
      }
    } catch (error) {
      console.error('Enhance error:', error);
      setInput(originalInput); // Restore original on error
    } finally {
      setIsEnhancing(false);
    }
  };

  const saveEnhancerPrompt = (newPrompt: string) => {
    setEnhancerPrompt(newPrompt);
    localStorage.setItem('primekg_enhancer_prompt', newPrompt);
  };

  const MAX_TOTAL_BYTES = 5 * 1024 * 1024; // 5MB limit for cloud sync optimization


  const readFileAsBase64 = (file: File, fileType: 'pdf' | 'image' | 'audio' | 'video' | 'text') =>
    new Promise<{ name: string; data: string; mimeType: string; type: 'pdf' | 'image' | 'audio' | 'video' | 'text'; size: number }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('File read error'));
      reader.onload = (event) => {
        if (fileType === 'text') {
          const textContent = event.target?.result as string;
          resolve({
            name: file.name,
            data: btoa(unescape(encodeURIComponent(textContent))),
            mimeType: file.type || 'text/plain',
            type: fileType,
            size: file.size
          });
        } else {
          const base64 = event.target?.result as string;
          const base64Data = base64.split(',')[1];
          resolve({
            name: file.name,
            data: base64Data,
            mimeType: file.type,
            type: fileType,
            size: file.size
          });
        }
      };

      if (fileType === 'text') {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentTotal = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
    const incomingTotal = files.reduce((sum, f) => sum + f.size, 0);

    if (currentTotal + incomingTotal > MAX_TOTAL_BYTES) {
      alert('Total attachments exceed 5MB. For cloud sync optimization, please keep files under 5MB total.');
      e.target.value = '';
      return;
    }

    try {
      const processed: Array<{ name: string; data: string; mimeType: string; type: 'pdf' | 'image' | 'audio' | 'video' | 'text'; size: number }> = [];

      for (const file of files) {
        let fileType: 'pdf' | 'image' | 'audio' | 'video' | 'text';
        if (file.type === 'application/pdf') {
          fileType = 'pdf';
        } else if (file.type.startsWith('image/')) {
          fileType = 'image';
        } else if (file.type.startsWith('audio/')) {
          fileType = 'audio';
        } else if (file.type.startsWith('video/')) {
          fileType = 'video';
        } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
          fileType = 'text';
        } else {
          alert(`Unsupported file type: ${file.name}. Supported: PDF, Images (JPG, PNG, WebP), Audio (MP3, WAV), Video (MP4), Text (TXT, CSV, JSON)`);
          continue;
        }

        const item = await readFileAsBase64(file, fileType);
        processed.push(item);
      }

      if (processed.length > 0) {
        setUploadedFiles(prev => [...prev, ...processed]);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read file');
    } finally {
      e.target.value = '';
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items || []);
    const imageItems = items.filter(item => item.type.startsWith('image/'));
    if (imageItems.length === 0) return;

    e.preventDefault();

    const files: File[] = imageItems
      .map(item => item.getAsFile())
      .filter((f): f is File => !!f);

    if (files.length === 0) return;

    const currentTotal = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
    const incomingTotal = files.reduce((sum, f) => sum + f.size, 0);

    if (currentTotal + incomingTotal > MAX_TOTAL_BYTES) {
      alert('Total attachments exceed 20MB, which is the default Gemini limit. Please remove some files or upload smaller ones.');
      return;
    }

    try {
      const processed: Array<{ name: string; data: string; mimeType: string; type: 'pdf' | 'image' | 'audio' | 'video' | 'text'; size: number }> = [];

      for (const file of files) {
        const fileType: 'image' = 'image';
        const item = await readFileAsBase64(file, fileType);
        processed.push(item);
      }

      if (processed.length > 0) {
        setUploadedFiles(prev => [...prev, ...processed]);
      }
    } catch (error) {
      console.error('Paste image error:', error);
      alert('Failed to paste image');
    }
  };

  const hasMessages = messages.length > 0 && !(messages.length === 1 && messages[0].id === 'welcome');

  return (
    <div className="flex flex-col h-full relative">
      <div className="absolute top-4 right-4 z-40 hidden lg:block">
        <CostTracker currentUsage={currentUsage} sessionTotal={sessionTotal} />
      </div>
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={(key) => setHasApiKey(!!key)}
        darkMode={darkMode}
      />

      {/* Main Content - no header offset needed since header is in Layout */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col pb-44 px-4">

        {!hasMessages ? (
          /* Landing View - Full-space anti-hallucination focused design */
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 animate-fade-in-up">
            {/* Main Hero Section */}
            <div className="max-w-4xl w-full text-center space-y-8">


              {/* Main Title */}
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                  Hallucination-Free Biomedical AI
                  <span className={`block mt-2 bg-gradient-to-r ${darkMode
                    ? 'from-emerald-400 via-cyan-400 to-indigo-400'
                    : 'from-emerald-600 via-cyan-600 to-indigo-600'
                    } bg-clip-text text-transparent`}>
                    via Graph Grounding
                  </span>
                </h1>
                <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed text-muted-foreground">
                  Standard LLMs predict probable words; we retrieve verified facts.
                  Every answer is strictly constrained to nodes and edges within the{' '}
                  <a
                    href="https://zitniklab.hms.harvard.edu/projects/PrimeKG/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`font-semibold ${darkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'} transition-colors`}
                  >
                    PrimeKG Knowledge Graph
                  </a>,
                  eliminating generative fabrication.
                </p>
              </div>

              {/* How it works - 3 steps */}
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-foreground`}>
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-zinc-800/50' : 'bg-white shadow-sm border border-slate-200'}`}>
                  <div className="text-2xl mb-2">💬</div>
                  <div className="text-sm font-medium">1. Ask in English</div>
                  <div className={`text-xs mt-1 text-tertiary`}>
                    "What drugs target TP53?"
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-zinc-800/50' : 'bg-white shadow-sm border border-slate-200'}`}>
                  <div className="text-2xl mb-2">🔍</div>
                  <div className="text-sm font-medium">2. We Query PrimeKG</div>
                  <div className={`text-xs mt-1 text-tertiary`}>
                    Real graph traversal, not guessing
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-zinc-800/50' : 'bg-white shadow-sm border border-slate-200'}`}>
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-sm font-medium">3. Get Verified Answers</div>
                  <div className={`text-xs mt-1 text-tertiary`}>
                    With source traces & visualizations
                  </div>
                </div>
              </div>

              {/* API Key CTA */}
              {!hasApiKey && (
                <div className={`max-w-md mx-auto p-6 rounded-2xl border ${darkMode
                  ? 'border-indigo-500/30 bg-indigo-500/10'
                  : 'border-indigo-200 bg-indigo-50 shadow-lg'
                  }`}>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <span className={`material-symbols-outlined text-2xl text-indigo-500`}>rocket_launch</span>
                    <span className={`font-semibold text-lg text-foreground`}>Ready to Start?</span>
                  </div>
                  <p className={`text-sm mb-4 text-center text-secondary leading-relaxed`}>
                    100% free. Just add your Gemini API key (also free).
                  </p>
                  <button
                    onClick={() => setShowApiKeyModal(true)}
                    className="w-full py-3 px-6 rounded-xl font-medium text-sm transition-all hover-lift bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  >
                    Add API Key & Start Exploring
                  </button>
                  <p className={`mt-3 text-xs text-tertiary`}>
                    Get your free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline hover:text-primary">Google AI Studio</a> • Stored locally
                  </p>
                </div>
              )}

              {/* If has API key, show suggested questions */}
              {hasApiKey && (
                <div className="space-y-6 mt-4">
                  <div className={`text-center text-secondary`}>
                    <p className="text-sm">
                      <span className="text-emerald-500 mr-2">✓</span>
                      API key configured. Ready to explore!
                    </p>
                  </div>
                  <SuggestedQuestions
                    onSelectQuestion={(query) => {
                      setInput(query);
                      // Do not auto-send; let user review and submit
                    }}
                    darkMode={darkMode}
                    maxQuestions={4}
                  />
                </div>
              )}
            </div>
          </div>

        ) : (
          /* Chat History */
          <div className="max-w-3xl w-full mx-auto space-y-6 pt-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
                <div className={`max-w-[85%] space-y-1 ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                  <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                    ? 'bg-secondary text-foreground rounded-tr-sm'
                    : 'bg-muted text-foreground border border-border transition-all hover:bg-muted/80'
                    }`}>
                    {msg.role !== 'user' ? (
                      <div className={`prose prose-sm max-w-none ${darkMode ? 'prose-invert' : 'prose-slate'}`}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            ...markdownComponents,
                            p: ({ children }: any) => (
                              <p>
                                {typeof children === 'string' ? (
                                  <EntityMention text={children} onExploreNode={handleExploreNode} darkMode={darkMode} />
                                ) : (
                                  children
                                )}
                              </p>
                            )
                          } as any}
                        >
                          {msg.role === 'model' 
                            ? msg.content.replace(/\[\s*\]/g, '[Beep Boop. Nothing was found]') 
                            : msg.content}
                        </ReactMarkdown>

                        {/* Hypothesis Cards - Visual representation of drug repurposing, targets, combinations */}
                        {msg.relatedData && msg.relatedData.type && msg.relatedData.data && (
                          <HypothesisCards
                            data={msg.relatedData.data}
                            type={msg.relatedData.type}
                            darkMode={darkMode}
                            onExploreNode={handleExploreNode}
                          />
                        )}

                        {/* Graph Visualization - Only show if relatedData has nodes (not hypothesis data) */}
                        {msg.relatedData && msg.relatedData.nodes && msg.relatedData.nodes.length > 0 ? (
                          <div className="mt-4 w-full h-[500px]">
                            <React.Suspense fallback={
                              <div className="w-full h-full bg-white/50 dark:bg-black/20 rounded-xl animate-pulse flex items-center justify-center border border-border/50">
                                <div className="flex flex-col items-center gap-2 text-tertiary">
                                  <span className="material-symbols-outlined text-3xl animate-spin">cyclone</span>
                                  <span className="text-xs font-medium">Loading visualization...</span>
                                </div>
                              </div>
                            }>
                                <GraphVisualization
                                  data={msg.relatedData}
                                  darkMode={darkMode}
                                  onNodeClick={handleNodeClick}
                                />
                            </React.Suspense>
                            <div className="mt-2 flex items-center justify-between text-[10px] text-tertiary">
                              <span>Graph rendered with {msg.relatedData.nodes.length} nodes and {msg.relatedData.edges.length} edges</span>
                              {msg.relatedData.isTruncated && (
                                <span className="text-amber-500 font-medium">⚠️ Limited view for performance</span>
                              )}
                            </div>
                          </div>
                        ) : (msg.relatedData && !msg.relatedData.type) ? (
                          <div className="mt-4 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-600 dark:text-amber-400">
                            ⚠️ Graph data present but empty nodes/edges.
                            <details>
                              <summary>Debug Info</summary>
                              <pre className="mt-2 p-2 bg-black/50 rounded overflow-auto max-h-40 text-[10px]">
                                {JSON.stringify(msg.relatedData, null, 2)}
                              </pre>
                            </details>
                          </div>
                        ) : null}

                        {/* Trace & Data */}
                        {msg.trace && msg.trace.length > 0 && (
                          <details className="mt-3 text-xs border-t border-border pt-2">
                            <summary className="cursor-pointer text-tertiary hover:text-secondary select-none">Show Trace</summary>
                            <ol className="mt-2 list-decimal list-inside space-y-1 text-tertiary font-mono">
                              {msg.trace.map((t, i) => <li key={i}>{t}</li>)}
                            </ol>
                          </details>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                         {msg.relatedData?.files && Array.isArray(msg.relatedData.files) && (
                            <div className="flex flex-wrap gap-2">
                              {msg.relatedData.files.map((file: any, idx: number) => 
                                file.type === 'image' && (
                                  <img 
                                    key={idx} 
                                    src={`data:${file.mimeType};base64,${file.data}`} 
                                    alt="Attachment" 
                                    className="max-w-full h-auto max-h-64 rounded-lg border border-white/10"
                                  />
                                )
                              )}
                            </div>
                         )}
                         <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    )}
                  </div>


                </div>
              </div>
            ))}

            {isLoading && (
              <div className="space-y-4 animate-fade-in">
                {/* Tool Execution Chips - Visual feedback */}
                <ToolExecutionChips traceEntries={liveTrace} darkMode={darkMode} />

                {/* Detailed trace (collapsible) */}
                <div className="flex justify-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-indigo-400 animate-pulse">smart_toy</span>
                  </div>
                  <div className="bg-surface/40 backdrop-blur-sm border border-border rounded-2xl rounded-tl-sm px-5 py-4 max-w-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-tertiary">Agent Trace</span>
                      <button
                        onClick={() => setIsTraceCollapsed(!isTraceCollapsed)}
                        className="text-tertiary hover:text-primary transition-colors p-1"
                        title={isTraceCollapsed ? "Expand trace" : "Collapse trace"}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isTraceCollapsed ? 'expand_more' : 'expand_less'}
                        </span>
                      </button>
                    </div>
                    {!isTraceCollapsed && (
                      <>
                        {liveTrace.length > 0 ? (
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {liveTrace.map((trace, idx) => (
                              <div key={idx} className="text-xs text-tertiary font-mono flex items-start gap-2">
                                <span className="text-accent font-semibold flex-shrink-0">→</span>
                                <span className="break-words">{trace}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce-delay-1"></div>
                            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce-delay-2"></div>
                            <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce-delay-3"></div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}></div>
          </div>
        )}
      </div>

      {/* Input Area - positioned at bottom of chat content */}
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 z-30 pointer-events-none">

        <div className="max-w-3xl mx-auto w-full pointer-events-auto">
          <div
            onClick={() => textareaRef.current?.focus()}
            className="relative bg-surface border border-border rounded-2xl transition-all duration-200 shadow-sm cursor-text"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              className="w-full bg-transparent border-none text-foreground placeholder-muted-foreground/60 focus:ring-0 focus:outline-none focus-visible:outline-none resize-none py-3.5 px-4 leading-relaxed text-[15px] min-h-[52px] max-h-48 no-scrollbar"
              placeholder="Ask about diseases, drugs, or molecular mechanisms..."
              rows={1}
            ></textarea>

            {uploadedFiles.length > 0 && (
              <div className="px-5 pb-2 flex gap-3 overflow-x-auto py-2">
                {uploadedFiles.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="relative group flex-shrink-0 animate-scale-in">
                    {f.type === 'image' ? (
                       <div className="relative">
                          <img src={`data:${f.mimeType};base64,${f.data}`} alt={f.name} className="h-20 w-auto rounded-lg border border-border object-cover shadow-sm" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); setUploadedFiles(prev => prev.filter(x => x !== f)); }} 
                            className="absolute -top-2 -right-2 bg-background border border-border rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:text-red-500 shadow-md transition-colors"
                          >
                            ✕
                          </button>
                       </div>
                    ) : (
                      <div className="bg-surface-hover px-3 py-2 rounded-lg border border-border text-xs text-secondary flex items-center gap-2 h-10">
                        <span className="material-symbols-outlined text-[16px]">description</span>
                        <span className="max-w-[100px] truncate">{f.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); setUploadedFiles(prev => prev.filter(x => x !== f)); }} className="hover:text-red-500 ml-1">×</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between px-3 pb-2.5 pt-0.5">
              <div className="flex items-center gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-tertiary hover:text-secondary hover:bg-surface-hover transition-colors"
                  title="Attach context"
                >
                  <span className="material-symbols-outlined text-[20px]">attach_file</span>
                </button>

                {/* Auto-Search Toggle (Optimization) */}
                <button
                  onClick={() => {
                    const newValue = !autoSearchEnabled;
                    setAutoSearchEnabled(newValue);
                    if (newValue) {
                         setWebSearchEnabled(false); // Mutual exclusion: Disable Web Search if Graph is active
                    }
                  }}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${autoSearchEnabled
                    ? 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20'
                    : 'text-tertiary hover:text-secondary hover:bg-surface-hover'
                    }`}
                  title={autoSearchEnabled
                    ? 'Auto-Grounding ON - Automatically resolves entities (Best accuracy)'
                    : 'Auto-Grounding OFF - Only searches if explicitly asked (Saves tokens)'
                  }
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {autoSearchEnabled ? 'find_in_page' : 'search_off'}
                  </span>
                </button>

                {/* Google Search Grounding Toggle */}
                <button
                  onClick={() => {
                    const newValue = !webSearchEnabled;
                    setWebSearchEnabled(newValue);
                    if (newValue) {
                        setAutoSearchEnabled(false); // Mutual exclusion: Disable Graph Auto-Grounding if Web Search is active
                    }
                  }}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${webSearchEnabled
                    ? 'text-blue-500 bg-blue-500/10 hover:bg-blue-500/20'
                    : 'text-tertiary hover:text-secondary hover:bg-surface-hover'
                    }`}
                  title={webSearchEnabled
                    ? 'Web Search ON (PrimeKG Disabled) - Searches internet only'
                    : 'Web Search OFF (PrimeKG Enabled) - Queries Knowledge Graph'
                  }
                >
                  <span className="material-symbols-outlined text-[20px]">language</span>
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleEnhancePrompt}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-tertiary hover:text-secondary hover:bg-surface-hover transition-colors ${isEnhancing ? 'animate-subtle-pulse text-accent' : ''}`}
                  title="Enhance prompt with gemini-2.0-flash-exp"
                >
                  <span className="material-symbols-outlined text-[20px]">auto_fix_high</span>
                </button>
                <button
                  onClick={isLoading ? handleStop : handleSend}
                  disabled={!isLoading && !input.trim()}
                  className={`send-button ${isLoading ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/30' : ''}`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isLoading ? 'stop' : 'arrow_upward'}
                  </span>
                </button>
              </div>
            </div>

            {/* Active Mode Indicator */}
            {/* Active Mode Indicators */}
            {autoSearchEnabled && (
              <div className="px-2 pb-1 text-xs text-emerald-500 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-1 border-t border-border/50 pt-1 mx-0.5 mt-0.5">
                <span className="material-symbols-outlined text-[14px]">find_in_page</span>
                <span><b>Auto-Grounding Active:</b> Entity resolution is enabled for better accuracy.</span>
                <Link to="/docs/auto-grounding" className="ml-auto flex items-center gap-1 opacity-70 hover:opacity-100 hover:underline">
                  <span className="material-symbols-outlined text-[12px]">help</span>
                  Learn more
                </Link>
              </div>
            )}
            {webSearchEnabled && (
              <div className="px-2 pb-1 text-xs text-blue-500 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-1 border-t border-border/50 pt-1 mx-0.5 mt-0.5">
                <span className="material-symbols-outlined text-[14px]">info</span>
                <span><b>Web Search Active:</b> PrimeKG tools are disabled to prevent conflicts. Turning off will re-enable Graph access.</span>
                <Link to="/docs/web-search" className="ml-auto flex items-center gap-1 opacity-70 hover:opacity-100 hover:underline">
                  <span className="material-symbols-outlined text-[12px]">help</span>
                  Learn more
                </Link>
              </div>
            )}
          </div>
        </div>
      </div >
    </div>
  );
};

export default ChatInterface;
