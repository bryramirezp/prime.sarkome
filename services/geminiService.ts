import { GoogleGenAI, Type, FunctionDeclaration, Tool, Part } from "@google/genai";
import { GeminiModel } from '../types';
import { kgService } from './kgService';
import { searchEntityCitations } from './pubmedService';

// --- Tool Definitions ---

// 1. Health
const checkHealthDecl: FunctionDeclaration = {
  name: "checkHealth",
  description: "Check the health status of the PrimeKG API.",
};

// 2. Stats
const getGraphStatsDecl: FunctionDeclaration = {
  name: "getGraphStats",
  description: "Get statistics about the Knowledge Graph (node counts, edge counts).",
};

// 3. Text Search
const searchTextDecl: FunctionDeclaration = {
  name: "searchText",
  description: "Perform a text-based search in the Knowledge Graph.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "The search query text." },
    },
    required: ["query"],
  },
};

// 4. Semantic Search
const searchSemanticDecl: FunctionDeclaration = {
  name: "searchSemantic",
  description: "Perform an AI-powered semantic search to find related entities in the Knowledge Graph.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "The search query." },
    },
    required: ["query"],
  },
};

// 5. Neighbors
const getNeighborsDecl: FunctionDeclaration = {
  name: "getNeighbors",
  description: "Get 1-hop neighbors for a specific node in the graph. IMPORTANT: Use the entity NAME (e.g., 'CNR1', 'Aspirin'), NOT the numeric db_id.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      nodeId: { type: Type.STRING, description: "The NAME of the entity (e.g., 'CNR1', 'Aspirin', 'Diabetes'). Do NOT use numeric IDs like '1268'." },
    },
    required: ["nodeId"],
  },
};

// 6. Subgraph
const getSubgraphDecl: FunctionDeclaration = {
  name: "getSubgraph",
  description: "Get a subgraph visualization for a specific entity. IMPORTANT: Use the entity NAME (e.g., 'CNR1', 'Aspirin'), NOT the numeric db_id.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      entity: { type: Type.STRING, description: "The NAME of the entity (e.g., 'CNR1', 'Aspirin'). Do NOT use numeric IDs." },
      hops: { type: Type.NUMBER, description: "Number of hops to traverse (1-3). Default: 1" },
      limit: { type: Type.NUMBER, description: "Maximum number of nodes to return. Default: 50" },
    },
    required: ["entity"],
  },
};

// 7. Shortest Path
const getShortestPathDecl: FunctionDeclaration = {
  name: "getShortestPath",
  description: "Find the shortest path between two entities in the graph. IMPORTANT: Use entity NAMES (e.g., 'CNR1', 'Aspirin'), NOT numeric db_ids.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      source: { type: Type.STRING, description: "The NAME of the source entity (e.g., 'CNR1', 'Aspirin')." },
      target: { type: Type.STRING, description: "The NAME of the target entity (e.g., 'Diabetes', 'TP53')." },
    },
    required: ["source", "target"],
  },
};

// 8. Drug Repurposing
const getDrugRepurposingDecl: FunctionDeclaration = {
  name: "getDrugRepurposing",
  description: "Find potential drug repurposing candidates for a specific disease.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      disease: { type: Type.STRING, description: "The name of the disease." },
    },
    required: ["disease"],
  },
};

// 9. Therapeutic Targets
const getTherapeuticTargetsDecl: FunctionDeclaration = {
  name: "getTherapeuticTargets",
  description: "Identify therapeutic targets (genes/proteins) for a disease.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      disease: { type: Type.STRING, description: "The name of the disease." },
    },
    required: ["disease"],
  },
};

// 10. Mechanisms (Drug-Disease)
const getMechanismDecl: FunctionDeclaration = {
  name: "getMechanism",
  description: "Explore the biological mechanism of action between a drug and a disease.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      drug: { type: Type.STRING, description: "The drug name." },
      disease: { type: Type.STRING, description: "The disease name." },
    },
    required: ["drug", "disease"],
  },
};

// 11. Drug Combinations
const getDrugCombinationsDecl: FunctionDeclaration = {
  name: "getDrugCombinations",
  description: "Find potential drug combinations and synergistic interactions.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      drug: { type: Type.STRING, description: "The name of the drug." },
    },
    required: ["drug"],
  },
};

// 12. Phenotype Matching
const getPhenotypeMatchingDecl: FunctionDeclaration = {
  name: "getPhenotypeMatching",
  description: "Find drug candidates based on shared phenotypes (symptoms) with a disease.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      disease: { type: Type.STRING, description: "The disease name to find matches for." },
    },
    required: ["disease"],
  },
};

// 13. Environmental Risks
const getEnvironmentalRisksDecl: FunctionDeclaration = {
  name: "getEnvironmentalRisks",
  description: "Identify environmental exposures and risk factors linked to a disease.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      disease: { type: Type.STRING, description: "The disease name to analyze." },
    },
    required: ["disease"],
  },
};

// 14. Literature Search (RAG)
const getLiteratureDecl: FunctionDeclaration = {
  name: "getLiterature",
  description: "Search for scientific literature (PubMed/Europe PMC) to find evidence, papers, or citations for a specific biomedical entity.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      entity: { type: Type.STRING, description: "The name of the entity (gene, drug, disease)." },
      type: { type: Type.STRING, description: "The type of entity: 'gene', 'drug', 'disease', or 'pathway'. Default: 'gene'" },
    },
    required: ["entity"],
  },
};

// --- Token Optimization Config ---
export const TOKEN_OPTIMIZATION_CONFIG = {
  MAX_HISTORY_MESSAGES: 10,
  MAX_MESSAGE_LENGTH: 2000,
  MAX_TOOL_RESPONSE_ITEMS: 25,
  INCLUDE_HISTORY_SUMMARY: true,
};

/**
 * Prepara el historial de chat para enviar al LLM con optimización de tokens.
 * Implementa sliding window + truncado de mensajes largos.
 */
function prepareOptimizedHistory(
  messages: Array<{ role: string; parts: Array<{ text: string }> }>,
  config = TOKEN_OPTIMIZATION_CONFIG
): Array<{ role: string; parts: Array<{ text: string }> }> {
  const { MAX_HISTORY_MESSAGES, MAX_MESSAGE_LENGTH, INCLUDE_HISTORY_SUMMARY } = config;

  if (messages.length <= MAX_HISTORY_MESSAGES) {
    return messages.map(msg => ({
      role: msg.role,
      parts: msg.parts.map(part => ({
        text: part.text.length > MAX_MESSAGE_LENGTH
          ? part.text.slice(0, MAX_MESSAGE_LENGTH) + '...[truncated]'
          : part.text
      }))
    }));
  }

  const recentMessages = messages.slice(-MAX_HISTORY_MESSAGES);
  const droppedCount = messages.length - MAX_HISTORY_MESSAGES;
  const result: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  if (INCLUDE_HISTORY_SUMMARY && droppedCount > 0) {
    result.push({
      role: 'user',
      parts: [{
        text: `[Context: This conversation has ${droppedCount} earlier messages not shown. The discussion may reference earlier topics.]`
      }]
    });
  }

  recentMessages.forEach(msg => {
    result.push({
      role: msg.role,
      parts: msg.parts.map(part => ({
        text: part.text.length > MAX_MESSAGE_LENGTH
          ? part.text.slice(0, MAX_MESSAGE_LENGTH) + '...[truncated]'
          : part.text
      }))
    });
  });

  return result;
}

/**
 * Trunca las respuestas de herramientas para reducir tokens.
 */
function truncateToolResponse(
  result: any,
  maxItems = TOKEN_OPTIMIZATION_CONFIG.MAX_TOOL_RESPONSE_ITEMS
): any {
  if (!result || result.error) return result;

  if (Array.isArray(result)) {
    if (result.length <= maxItems) return result;
    return {
      items: result.slice(0, maxItems),
      _truncated: true,
      _originalCount: result.length,
      _message: `Showing first ${maxItems} of ${result.length} results`
    };
  }

  if (result.nodes && Array.isArray(result.nodes)) {
    if (result.nodes.length <= maxItems) return result;

    const truncatedNodes = result.nodes.slice(0, maxItems);
    const nodeIds = new Set(truncatedNodes.map((n: any) => n.id));
    const truncatedEdges = (result.edges || [])
      .filter((e: any) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .slice(0, maxItems * 2);

    return {
      ...result,
      nodes: truncatedNodes,
      edges: truncatedEdges,
      _truncated: true,
      _originalNodeCount: result.nodes.length,
      _originalEdgeCount: result.edges?.length || 0
    };
  }

  if (result.candidates && Array.isArray(result.candidates)) {
    if (result.candidates.length <= maxItems) return result;
    return {
      ...result,
      candidates: result.candidates.slice(0, maxItems),
      _truncated: true,
      _originalCount: result.candidates.length
    };
  }

  if (result.targets && Array.isArray(result.targets)) {
    if (result.targets.length <= maxItems) return result;
    return {
      ...result,
      targets: result.targets.slice(0, maxItems),
      _truncated: true,
      _originalCount: result.targets.length
    };
  }

  if (result.combinations && Array.isArray(result.combinations)) {
    if (result.combinations.length <= maxItems) return result;
    return {
      ...result,
      combinations: result.combinations.slice(0, maxItems),
      _truncated: true,
      _originalCount: result.combinations.length
    };
  }

  return result;
}

const tools: Tool[] = [{
  functionDeclarations: [
    checkHealthDecl,
    getGraphStatsDecl,
    searchTextDecl,
    searchSemanticDecl,
    getNeighborsDecl,
    getSubgraphDecl,
    getShortestPathDecl,
    getDrugRepurposingDecl,
    getTherapeuticTargetsDecl,
    getMechanismDecl,
    getDrugCombinationsDecl,
    getPhenotypeMatchingDecl,
    getEnvironmentalRisksDecl,
    getLiteratureDecl
  ]
}];

export const generateResponse = async (
  prompt: string,
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  modelName: GeminiModel = GeminiModel.FLASH,
  userApiKey?: string,
  fileAttachments?: Array<{ name: string; data: string; mimeType: string }>,
  onLog?: (entry: string) => void,
  abortSignal?: AbortSignal,
  options?: { enableWebSearch?: boolean }
): Promise<{ text: string; data?: any; usage?: { promptTokens: number; completionTokens: number } }> => {
  // Get active tool context from sessionStorage
  const activeTool = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('activeTool') : null;
  const toolContext = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('toolContext') : null;

  // Priority: 1) User-provided key, 2) localStorage key, 3) env key
  let geminiApiKey = userApiKey || '';

  // Try to get from localStorage if running in browser
  if (!geminiApiKey && typeof window !== 'undefined') {
    geminiApiKey = localStorage.getItem('primekg_gemini_api_key') || '';
  }

  // Fallback to env vars (for development)
  if (!geminiApiKey) {
    geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';
  }

  if (!geminiApiKey) {
    return {
      text: "⚠️ **You don't have an API key set.**\n\nTo use PrimeAI, add your own Google Gemini API key.\n\nClick the **⚙️ Set API Key** button at the top to add it.\n\n📖 You can get one for free at [Google AI Studio](https://aistudio.google.com/app/apikey)."
    };
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  // Build tools dynamically based on options
  // IMPORTANT: Google Search and Function Calling are MUTUALLY EXCLUSIVE in current API versions.
  // We must choose one or the other to avoid 400 "Tool use with function calling is unsupported".

  let activeTools: Tool[] = [];
  let modeSystemInstruction = "";

  if (options?.enableWebSearch) {
    // MODE: WEB SEARCH (Graph access disabled to prevent API error)
    activeTools = [{ googleSearch: {} }];
    modeSystemInstruction = `
## MODE: WEB SEARCH
You have access to **Google Search** to find real-time information from the internet.
⚠️ NOTE: In this mode, you do NOT have direct access to PrimeKG tools. You must rely on Google Search and your internal knowledge.

Use Google Search when:
- The user asks about recent clinical trials, news, or general medical info.
- You need verification from live web sources.
`;
  } else {
    // MODE: PRIMEKG GRAPH (Default)
    activeTools = [{
      functionDeclarations: [
        checkHealthDecl,
        getGraphStatsDecl,
        searchTextDecl,
        searchSemanticDecl,
        getNeighborsDecl,
        getSubgraphDecl,
        getShortestPathDecl,
        getDrugRepurposingDecl,
        getTherapeuticTargetsDecl,
        getMechanismDecl,
        getDrugCombinationsDecl,
        getPhenotypeMatchingDecl,
        getEnvironmentalRisksDecl
      ]
    }];
    modeSystemInstruction = `
## MODE: PRIMEKG KNOWLEDGE GRAPH
You have access to the **PrimeKG** precision medicine knowledge graph.
Use the available tools (searchSemantic, getNeighbors, etc.) to query the graph.
`;
  }

  const chat = ai.chats.create({
    model: modelName,
    config: {
      tools: activeTools,
      systemInstruction: `You are PrimeAI, an advanced biomedical research assistant with access to the PrimeKG knowledge graph.

${modeSystemInstruction}

## YOUR ROLE
You translate natural language questions into structured knowledge graph queries AND scientific literature searches. You explain results in clear, scientific language, citing papers when available.

## RESPONSE GUIDELINES
Provide natural, cohesive answers. Never include internal process labels, step numbers, or meta-commentary about your workflow. The user should only see the final scientific explanation.

## WORKFLOW (Internal Process - Never Mention This)
First, resolve entities using semantic search. Then query appropriate tools. Finally, synthesize findings into clear explanations with biological context.

## TOOL SELECTION
- **searchSemantic**: For concepts, categories, or uncertain names ("MDM2 inhibitors", "lung cancer drugs")
- **searchText**: Only for exact entity names ("Aspirin", "TP53")
- **getNeighbors**: Find direct connections to an entity
- **getSubgraph**: Visualize local network around an entity
- **getShortestPath**: Find how two entities connect
- **getDrugRepurposing**: Find drug candidates for a disease
- **getTherapeuticTargets**: Identify drug targets for a disease
- **getDrugCombinations**: Find synergistic drug combinations
- **getMechanism**: Explain drug-disease mechanism of action
- **getPhenotypeMatching**: Find drugs based on symptom overlap
- **getEnvironmentalRisks**: Identify disease risk factors (toxins, lifestyle)
- **getLiterature**: Find scientific papers to ground your answer with real citations

## CRITICAL RULES
1. **Always resolve entities first** - Use searchSemantic before other queries
2. **Pivot when needed** - If direct search fails, try indirect strategies (e.g., for TP53, search MDM2 regulators)
3. **Synthesize, don't dump** - Never show raw JSON. Explain biological meaning
4. **Handle empty results gracefully** - Explain why and suggest alternatives
5. **Be scientifically accurate** - Explain mechanisms, pathways, and significance
6. **Use clear formatting** - Use hyphens (-) not em dashes (—)

## RESPONSE STYLE
Professional but accessible. Explain biological mechanisms clearly. Provide context for findings. Cite specific relationships from the graph.
${toolContext ? `

## ACTIVE CONTEXT
${toolContext}` : ''}`,
    },
    history: prepareOptimizedHistory(history),
  });

  // Log active mode
  if (options?.enableWebSearch) {
    onLog?.('🌐 Mode: Web Search (Graph Tools Disabled)');
  } else {
    onLog?.('🧬 Mode: PrimeKG Graph');
  }

  try {
    onLog?.(`Model: ${modelName}`);
    // Prepare message with optional file attachments
    const messageParts: any[] = [{ text: prompt }];

    if (fileAttachments && fileAttachments.length > 0) {
      fileAttachments.forEach((file) => {
        messageParts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: file.data
          }
        });
      });
    }

    if (abortSignal?.aborted) throw new DOMException('Aborted', 'AbortError');
    let result = await chat.sendMessage({ message: messageParts.length === 1 ? prompt : messageParts });

    // Validate result structure
    if (!result) {
      console.error("Empty result from Gemini");
      return {
        text: "I encountered an error connecting to the AI model. Please try again.",
        data: null
      };
    }

    // Track total token usage across all turns
    let totalPromptTokens = 0;
    let totalCandidateTokens = 0;

    // 📊 Log token usage (Initial Turn)
    if (result?.usageMetadata) {
      const { promptTokenCount, candidatesTokenCount, totalTokenCount } = result.usageMetadata;
      totalPromptTokens += promptTokenCount || 0;
      totalCandidateTokens += candidatesTokenCount || 0;
      onLog?.(`📊 Tokens: ${promptTokenCount || 0} in → ${candidatesTokenCount || 0} out (${totalTokenCount || 0} total)`);
    }

    let functionCalls = result.functionCalls;
    const accumulatedToolResults: Array<{ name: string; args: any; result: any }> = [];
    let turns = 0;

    if (functionCalls?.length) {
      onLog?.(`Tool calls requested: ${functionCalls.length}`);
    }

    while (functionCalls && functionCalls.length > 0 && turns < 5) {
      if (abortSignal?.aborted) throw new DOMException('Aborted', 'AbortError');
      turns++;
      const functionResponseParts: Part[] = [];

      for (const call of functionCalls) {
        const { name, args } = call;
        console.log(`[Gemini] Calling tool: ${name}`, args);
        onLog?.(`Calling tool: ${name} ${args ? JSON.stringify(args) : ''}`);

        let apiResult;
        try {
          switch (name) {
            case "checkHealth":
              onLog?.('→ PrimeKG: /health');
              apiResult = await kgService.getHealth(abortSignal);
              break;
            case "getGraphStats":
              onLog?.('→ PrimeKG: /stats');
              apiResult = await kgService.getStats(abortSignal);
              break;
            case "searchText":
              onLog?.(`→ PrimeKG: /search/text?q=${String(args.query ?? '')}`);
              const rawText = await kgService.searchText(args.query as string, abortSignal);
              apiResult = truncateToolResponse(rawText);
              break;
            case "searchSemantic":
              onLog?.(`→ PrimeKG: /search/semantic?q=${String(args.query ?? '')}`);
              const rawSemantic = await kgService.searchSemantic(args.query as string, abortSignal);
              apiResult = truncateToolResponse(rawSemantic);
              break;
            case "getSubgraph":
              const hops = (args.hops as number) || 1;
              const limit = (args.limit as number) || 50;
              onLog?.(`→ PrimeKG: subgraph for ${String(args.entity ?? '')} (hops=${hops}, limit=${limit})`);
              const rawSubgraph = await kgService.getSubgraph(args.entity as string, hops, limit, abortSignal);
              apiResult = truncateToolResponse(rawSubgraph);
              break;
            case "getDrugRepurposing":
              onLog?.(`→ PrimeKG: repurposing for ${String(args.disease ?? '')}`);
              const rawRepurpose = await kgService.getDrugRepurposing(args.disease as string, abortSignal);
              apiResult = truncateToolResponse(rawRepurpose);
              break;
            case "getTherapeuticTargets":
              onLog?.(`→ PrimeKG: targets for ${String(args.disease ?? '')}`);
              const rawTargets = await kgService.getTherapeuticTargets(args.disease as string, abortSignal);
              apiResult = truncateToolResponse(rawTargets);
              break;
            case "getMechanism":
              onLog?.(`→ PrimeKG: mechanisms ${String(args.drug ?? '')} ↔ ${String(args.disease ?? '')}`);
              try {
                  const rawMech = await kgService.getDrugMechanism(args.drug as string, args.disease as string, abortSignal);
                  apiResult = truncateToolResponse(rawMech);
              } catch (err: any) {
                  // If 404, it just means no mechanism known, not a system failure.
                  if (err.message?.includes('404')) {
                      apiResult = { result: "No direct mechanism of action found in Knowledge Graph." };
                  } else {
                      throw err; // Re-throw actual errors
                  }
              }
              break;
            case "getShortestPath":
              onLog?.(`→ PrimeKG: path ${String(args.source ?? '')} → ${String(args.target ?? '')}`);
              try {
                  const rawPath = await kgService.getShortestPath(args.source as string, args.target as string, abortSignal);
                  apiResult = truncateToolResponse(rawPath);
              } catch (err: any) {
                  if (err.message?.includes('404')) {
                       apiResult = { result: "No path found between these entities within limit." };
                  } else {
                       throw err;
                  }
              }
              break;
            case "getNeighbors":
              onLog?.(`→ PrimeKG: neighbors for ${String(args.nodeId ?? '')}`);
              try {
                  const rawNeighbors = await kgService.getNeighbors(args.nodeId as string, abortSignal);
                  apiResult = truncateToolResponse(rawNeighbors);
              } catch (err: any) {
                  if (err.message?.includes('404')) {
                       apiResult = { result: "Entity found, but has no recorded neighbors in this graph view." };
                  } else {
                       throw err;
                  }
              }
              break;
            case "getDrugCombinations":
              onLog?.(`→ PrimeKG: combinations for ${String(args.drug ?? '')}`);
              const rawCombos = await kgService.getDrugCombinations(args.drug as string, abortSignal);
              apiResult = truncateToolResponse(rawCombos);
              break;
            case "getPhenotypeMatching":
              onLog?.(`→ PrimeKG: phenotype matching for ${String(args.disease ?? '')}`);
              const rawPheno = await kgService.getPhenotypeMatching(args.disease as string, abortSignal);
              apiResult = truncateToolResponse(rawPheno);
              break;
            case "getEnvironmentalRisks":
              onLog?.(`→ PrimeKG: environmental risks for ${String(args.disease ?? '')}`);
              const rawEnv = await kgService.getEnvironmentalRisks(args.disease as string, abortSignal);
              apiResult = truncateToolResponse(rawEnv);
              break;
            case "getLiterature":
              onLog?.(`→ PubMed: citations for ${String(args.entity ?? '')}`);
              const rawLit = await searchEntityCitations(args.entity as string, (args.type as any) || 'gene', 5);
              
              // Simplified for LLM consumption
              apiResult = rawLit.map(p => ({
                id: p.pmid,
                title: p.title,
                year: p.year,
                cited: p.citedByCount,
                abstract: p.abstract ? p.abstract.substring(0, 300) + '...' : 'No abstract'
              }));
              break;
            default:
              apiResult = { error: "Unknown function" };
          }
          accumulatedToolResults.push({ name, args, result: apiResult });
          onLog?.(`✓ Tool result received: ${name}`);
        } catch (e) {
          console.error(e);
          apiResult = { error: "Failed to fetch data from KG API." };
          accumulatedToolResults.push({ name, args, result: apiResult });
          onLog?.(`✗ Tool failed: ${name}`);
        }

        functionResponseParts.push({
          functionResponse: {
            name: name,
            response: { result: apiResult },
            id: call.id
          }
        });
      }

      if (abortSignal?.aborted) throw new DOMException('Aborted', 'AbortError');
      result = await chat.sendMessage({
        message: functionResponseParts
      });
      if (!result) {
        onLog?.('✗ No response returned from model');
        return {
          text: "I encountered an error connecting to the Precision Medicine Engine. Please try again or switch models.",
          data: accumulatedToolResults
        };
      }

      // 📊 Log token usage for tool response processing
      if (result?.usageMetadata) {
        const { promptTokenCount, candidatesTokenCount, totalTokenCount } = result.usageMetadata;
        totalPromptTokens += promptTokenCount || 0;
        totalCandidateTokens += candidatesTokenCount || 0;
        onLog?.(`📊 Tokens (turn ${turns}): ${promptTokenCount || 0} in → ${candidatesTokenCount || 0} out (${totalTokenCount || 0} total)`);
      }

      functionCalls = result.functionCalls;
    }

    // Extract text safely. The SDK warns if accessing .text when function calls are present.
    // However, if we exited the loop successfully, there shouldn't be pending function calls.
    // We check for candidates directly or via response to be robust.
    // @ts-ignore - Validating structure dynamically to prevent crashes
    const candidate = result?.candidates?.[0] || result?.response?.candidates?.[0];

    if (!candidate) {
      console.error("No candidate in result:", JSON.stringify(result, null, 2));
      return {
        text: "The AI model returned an unexpected response format. Please try again or use a different model.",
        data: accumulatedToolResults
      };
    }

    let responseText = "";
    if (candidate?.content?.parts) {
      responseText = candidate.content.parts
        .map((part: any) => part.text || "")
        .join("");
    } else {
      // Fallback to SDK getter if manual extraction fails
      responseText = result?.text || "";
    }

    // If we only got tool parts and no readable text, force a finalization step.
    if (!responseText && accumulatedToolResults.length > 0) {
      onLog?.('No text content returned; requesting final answer...');
      try {
        const final = await chat.sendMessage({
          message: "Using the tool results already provided, write a complete final answer in the user's language. Do not call any tools. If results are empty, explain that and propose next queries."
        });

        // @ts-ignore - dynamic structure
        const finalCandidate = final?.candidates?.[0] || final?.response?.candidates?.[0];
        if (finalCandidate?.content?.parts) {
          responseText = finalCandidate.content.parts.map((p: any) => p.text || '').join('');
        } else {
          // @ts-ignore
          responseText = final?.text || '';
        }

        // 📊 Log token usage for finalization
        if (final?.usageMetadata) {
          const { promptTokenCount, candidatesTokenCount, totalTokenCount } = final.usageMetadata;
          totalPromptTokens += promptTokenCount || 0;
          totalCandidateTokens += candidatesTokenCount || 0;
          onLog?.(`📊 Tokens (finalization): ${promptTokenCount || 0} in → ${candidatesTokenCount || 0} out (${totalTokenCount || 0} total)`);
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (!responseText && accumulatedToolResults.length > 0) {
      responseText = "I have retrieved the relevant data from the Knowledge Graph. Please review the structured output below.";
    } else if (!responseText) {
      responseText = "I'm sorry, I couldn't generate a response based on the available information.";
    }

    // Process Grounding Metadata (Google Search Sources)
    const groundingMetadata = candidate?.groundingMetadata;
    if (groundingMetadata?.groundingChunks) {
      const uniqueSources = new Map<string, string>();

      groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          uniqueSources.set(chunk.web.uri, chunk.web.title);
        }
      });

      if (uniqueSources.size > 0) {
        responseText += "\n\n---\n**Sources:**\n";
        Array.from(uniqueSources.entries()).forEach(([url, title], index) => {
          responseText += `${index + 1}. [${title}](${url})\n`;
        });

        onLog?.(`📚 Found ${uniqueSources.size} web sources`);
      }
    }

    onLog?.('Done');

    return {
      text: responseText,
      data: accumulatedToolResults.length > 0 ? accumulatedToolResults : undefined,
      usage: { promptTokens: totalPromptTokens, completionTokens: totalCandidateTokens }
    };

  } catch (error) {
    console.error("Gemini Interaction Error:", error);
    return { text: "I encountered an error connecting to the Precision Medicine Engine. Please try again or switch models." };
  }
};