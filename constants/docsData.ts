
export const DOCS_SECTIONS = [
  {
    id: 'primekg-graph',
    title: 'The Knowledge Graph',
    category: 'Core Concepts',
    icon: 'hub'
  },
  {
    id: 'auto-grounding',
    title: 'Auto-Grounding',
    category: 'AI Modes',
    icon: 'find_in_page'
  },
  {
    id: 'web-search',
    title: 'Web Search Mode',
    category: 'AI Modes',
    icon: 'language'
  }
];

export const DOCS_CONTENT: Record<string, string> = {

  'primekg-graph': `
# PrimeKG Knowledge Graph

**PrimeKG** (Precision Medicine Knowledge Graph) is the brain behind this application. Developed by the Zitnik Lab at Harvard Medical School, it creates a holistic view of human biology.

## What's inside?

It connects disparate datasets into a single web of meaning:

| Data Type | Count | Examples |
|-----------|-------|----------|
| **Drugs** | ~8,000 | Aspirin, Metformin |
| **Diseases** | ~17,000 | Type 2 Diabetes, Breast Cancer |
| **Genes/Proteins** | ~20,000 | TP53, BRCA1 |
| **Pathways** | ~12,000 | Cell Cycle, Apoptosis |

## How queries work

When you ask *"What targets does Metformin have?"*, the AI doesn't guess. It:
1. Finds the node \`Metformin\` (DB00331) in the graph.
2. Traverses the \`drug_target\` edges.
3. Returns the exact connected proteins.

This ensures **100% factual accuracy** based on the underlying dataset.
  `,

  'auto-grounding': `
# Auto-Grounding (Entity Resolution)

**Auto-Grounding** is an intelligent preprocessing step that automatically resolves natural language entity mentions into precise PrimeKG node IDs before executing graph queries.

---

## The Core Problem

Users communicate in **natural language**:
- *"lung cancer"*
- *"Alzheimer's disease"*
- *"aspirin"*

But PrimeKG (like all knowledge graphs) operates on **structured identifiers**:
- \`MONDO_0008903\` (Lung Carcinoma)
- \`MONDO_0004975\` (Alzheimer Disease)
- \`DRUGBANK:DB00945\` (Aspirin)

**Without entity resolution**, the AI would either:
1. Hallucinate responses based on its training data (unreliable)
2. Fail to query the graph at all (no grounding)

---

## How Auto-Grounding Works (Technical Flow)

When **Auto-Grounding is enabled**, the system automatically injects instructions into your prompt that force the AI to resolve entities **before** performing any graph operations.

### Step-by-Step Execution

#### 1. **User Input**
\`\`\`
User: "What drugs treat lung cancer?"
\`\`\`

#### 2. **Automatic Instruction Injection**
The system modifies your prompt behind the scenes:
\`\`\`
Original: "What drugs treat lung cancer?"

Modified: "What drugs treat lung cancer?

AUTO-RUN TASKS (use tools):
- If entities are mentioned, use searchSemantic to resolve them before other operations."
\`\`\`

#### 3. **AI Calls \`searchSemantic\`**
The AI (Gemini) reads the instruction and makes a tool call:
\`\`\`json
{
  "tool": "searchSemantic",
  "args": {
    "query": "lung cancer"
  }
}
\`\`\`

#### 4. **Semantic Search Execution**
The backend (\`/search/semantic\` endpoint) performs:

**a) Text → Embedding Conversion**
- Converts "lung cancer" into a 768-dimensional vector using **Google Gemini Embeddings**
- Example: \`[0.023, -0.891, 0.456, ...]\` (768 numbers)

**b) Vector Similarity Search**
- Compares the query embedding against **129,262 pre-computed node embeddings** in PrimeKG
- Uses **cosine similarity** to find the closest matches
- Returns top-k results ranked by semantic relevance

**c) API Response**
\`\`\`json
[
  {
    "id": "MONDO_0008903",
    "name": "Lung Carcinoma",
    "type": "disease",
    "similarity": 0.98
  },
  {
    "id": "MONDO_0005138", 
    "name": "Non-small cell lung cancer",
    "type": "disease",
    "similarity": 0.95
  }
]
\`\`\`

#### 5. **AI Uses Resolved IDs**
Now the AI knows the exact node ID and can query the graph:
\`\`\`json
{
  "tool": "getNeighbors",
  "args": {
    "nodeId": "MONDO_0008903"
  }
}
\`\`\`

This returns **actual drugs connected to that disease node** in PrimeKG.

#### 6. **Final Response**
The AI synthesizes a grounded answer:
\`\`\`
Based on PrimeKG data, 15 drugs are indicated for lung cancer treatment:
- Cisplatin (DRUGBANK:DB00515)
- Carboplatin (DRUGBANK:DB00958)
- Pembrolizumab (DRUGBANK:DB09037)
...
\`\`\`

---

## Why \`searchSemantic\` (Not \`searchText\`)?

PrimeKG offers two search endpoints:

| Endpoint | Method | Use Case |
|----------|--------|----------|
| \`/search/text\` | Exact string matching | When you know the **exact** entity name |
| \`/search/semantic\` | AI-powered embeddings | When using **natural language** or synonyms |

**Auto-Grounding uses \`searchSemantic\`** because:

✅ **Handles synonyms**: "lung cancer" = "pulmonary carcinoma" = "bronchogenic carcinoma"  
✅ **Typo-tolerant**: "alzhiemer" still finds "Alzheimer"  
✅ **Concept matching**: "diabetes drug" finds Metformin, Insulin, etc.  
✅ **Multi-language**: Works across medical terminologies (ICD, MONDO, SNOMED)

**Example Comparison:**

| Query | \`searchText\` | \`searchSemantic\` |
|-------|---------------|-------------------|
| "lung cancer" | ✅ Finds exact match | ✅ Finds + related concepts |
| "cancer of the lung" | ❌ No match | ✅ Finds lung cancer |
| "NSCLC" | ❌ No match | ✅ Finds Non-Small Cell Lung Cancer |

---

## When to Enable Auto-Grounding

### ✅ **Enable When:**
- Asking biomedical questions with entity mentions
- Querying drug-disease relationships
- Exploring pathways, targets, or mechanisms
- You want **maximum accuracy** and grounding

### ❌ **Disable When:**
- Having casual conversation (no graph queries needed)
- Asking general questions about how the system works
- You want to **save tokens** (skips the automatic search step)
- Testing the AI's reasoning without graph data

---

## Token Cost Impact

**With Auto-Grounding ON:**
- **+1 tool call** per query (searchSemantic)
- **~500-1000 extra tokens** depending on results
- **Higher accuracy** (grounded in real data)

**With Auto-Grounding OFF:**
- **No automatic search**
- **Fewer tokens used**
- **AI may hallucinate** if it doesn't call searchSemantic on its own

---

## Technical Implementation

The toggle is implemented in \`ChatInterface.tsx\`:

\`\`\`typescript
const executeChat = async (promptText: string) => {
  const autoTaskInstructions: string[] = [];

  if (autoSearchEnabled && !webSearchEnabled) {
    // Inject semantic search instruction
    autoTaskInstructions.push(
      \`If entities are mentioned, use searchSemantic to resolve them before other operations.\`
    );
  }

  const finalPrompt = autoTaskInstructions.length > 0
    ? \`\${promptText}\\n\\nAUTO-RUN TASKS (use tools):\\n- \${autoTaskInstructions.join('\\n- ')}\`
    : promptText;

  // Send to Gemini with injected instructions
  await generateResponse(finalPrompt, ...);
}
\`\`\`

The system instruction in \`geminiService.ts\` reinforces this:

\`\`\`typescript
systemInstruction: \`
### Step 1: GROUNDING
- If in PrimeKG Mode: You MUST use searchSemantic first to resolve entity IDs.
- Never skip entity resolution for biomedical queries.
\`
\`\`\`

---

## Summary

**Auto-Grounding = Automatic \`searchSemantic\` calls**

1. You ask a question in natural language
2. System injects "use searchSemantic" instruction
3. AI converts entities → embeddings → PrimeKG node IDs
4. AI queries graph with precise IDs
5. You get grounded, factual answers

**Result:** Zero hallucinations, 100% traceable to PrimeKG data.
  `,

  'web-search': `
# Web Search Mode (Google Grounding)

**Web Search Mode** breaks the "knowledge cutoff" of the Knowledge Graph using Google Search.

## How it works
PrimeKG is a static dataset (snapshot of scientific knowledge). It doesn't know about:
- Yesterday's FDA approvals.
- Breaking news in biotech.
- Papers published last week.

When you enable **Web Search**, the AI gains access to the real-time internet via Google.

## The Trade-off: Graph vs. Web
**Important:** When Web Search is **ON**, the specific PrimeKG tools (like \`getNeighbors\`) are **PAUSED**.

> <span class="text-blue-500 font-bold">Web Search Active: PrimeKG tools are disabled</span>

Why? Mixing "Graph Traversal" (strict structure) with "Web Browsing" (unstructured text) in a single turn often confuses the reasoning engine. We enforce a mode switch to ensure quality:

- **Use PrimeKG Mode (Default)**: For deep mechanisms, repurposing, and established biology.
- **Use Web Search Mode**: For news, clinical trial statuses, and general broad info.

## Citations
Web Search responses will always include a **Sources** section at the bottom, linking directly to the origin of the information.
  `
};
