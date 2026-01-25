
export const DOCS_SECTIONS = [
  {
    id: 'primekg-graph',
    title: 'The Knowledge Graph',
    category: 'Core Concepts',
    icon: 'hub'
  },
  {
    id: 'auto-grounding',
    title: 'Grounded Inference',
    category: 'AI Modes',
    icon: 'find_in_page'
  },
  {
    id: 'in-silico',
    title: 'In-Silico Validation',
    category: 'Lab Modules',
    icon: 'science'
  }
];

export const DOCS_CONTENT: Record<string, string> = {

  'primekg-graph': `
# PrimeKG: Biological Truth Engine

**PrimeKG** (Precision Medicine Knowledge Graph) is the deterministic foundation of this Bio-Lab. Developed by the Zitnik Lab at Harvard Medical School, it provides the "Ground Truth" that eliminates generative fabrications.

## Graph Scale & Rigor

We replace probabilistic predictions with strict traversal of 8.1 million validated relationships.

| Node Category | Inventory | Key Sources |
|---------------|-----------|-------------|
| **Drugs** | ~8,000 | DrugBank, DrugCentral |
| **Diseases** | ~17,000 | Mondo, OMIM, Orphanet |
| **Genes/Proteins** | ~20,000 | Entrez Gene, UniProt, DisGeNET |
| **Phenotypes** | ~15,000 | Human Phenotype Ontology (HPO) |

## Deterministic Retrieval

When the Bio-Lab processes a query like *"Identify therapeutic targets for Cystic Fibrosis"*, it does not predict the next probable word. It:
1. Resolves the clinical coordinates to the **MONDO_0009061** node.
2. Traverses established **disease_target** edges.
3. Filters by node degree and druggability metrics.

This ensures that every insight is a **navigable biological fact**, not a statistical guess.
  `,

  'auto-grounding': `
# Grounded Inference (Deterministic Reasoning)

**Grounded Inference** is the mechanism that ensures every AI thought is anchored to a physical node in the PrimeKG network. We eliminate "Hallucinations" by forcing the LLM to prove its reasoning through graph paths.

---

## Technical Flow: Text to Coordinates

1. **Semantic Interception**: Natural language inputs are converted into embeddings via Google Gemini.
2. **Coordinate Lock**: We perform cosine similarity search against 129K pre-computed vectors to find the exact PrimeKG node.
3. **Restricted Reasoning**: The AI is instructed that if a connection doesn't exist in the graph, it must report a "Zero Signal" rather than inventing a mechanism.

### Use Case: Technical Physician Workflow
A physician-scientist searching for *"PCSK9 inhibition effects"* is immediately locked onto **DRUGBANK:DB13155** (Evolocumab) and its specific gene-protein edges. The system audits the literature via **Evidence Audit** to provide the supporting publication for every edge found.
  `,

  'in-silico': `
# In-Silico Validation Lab

The **In-Silico Validation** module is a heuristic discovery engine designed to simulate and validate potential drug-disease vectors before clinical or industrial investment.

## Simulated Mechanisms
- **Path Discovery**: Identify multi-hop connections between established drugs and emerging disease targets.
- **Off-Label Identification**: Use network medicine principles to find drugs that target modules shared between different phenotypes.
- **Safety Profiling**: Trace edges to **SIDER** and **Phenotype** nodes to identify potential contraindications early.

## Deterministic Outcomes
Unlike generative AI, which might suggest a drug based on "vibes" or similar names, our In-Silico lab requires a **validated molecular path**. If the path is broken or non-existent in the global knowledge graph, the hypothesis is flagged as unsupported.
  `
};
