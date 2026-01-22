export const FAQ_DATA = [
    {
        id: 'hallucination',
        category: 'Core Concept',
        question: 'Does this AI hallucinate medical information?',
        answer: `**No.** Unlike ChatGPT and other generative LLMs, PrimeKG Explorer cannot hallucinate because it doesn't generate text from scratch.

Instead, it works like this:
1. You ask a question in natural language
2. The AI translates your question into structured queries
3. Those queries are executed against the **PrimeKG knowledge graph** (a verified database)
4. Only real data from the graph is returned

**Example:** If you ask "What drugs target TP53?", the system:
- Finds the TP53 node in the graph
- Traverses the \`drug_target\` edges
- Returns only drugs that actually have documented relationships

It's physically impossible for the system to invent a drug name or mechanism that doesn't exist in the underlying dataset.`,
        keywords: ['hallucination', 'accuracy', 'trust', 'reliability']
    },
    {
        id: 'free',
        category: 'Pricing',
        question: 'Is PrimeKG Explorer free to use?',
        answer: `**Yes, 100% free.** There's no paywall, subscription, or hidden costs.

**What you need:**
- A Google Gemini API key (also free from [Google AI Studio](https://aistudio.google.com/app/apikey))
- A web browser

**Why it's free:**
- The PrimeKG dataset is open-source (Harvard Medical School)
- We don't host the AI model (you use your own Gemini key)
- The knowledge graph API is provided as a public service

**Cost of Gemini API:**
- Free tier: 15 requests/minute
- Paid tier: ~$0.10 per 1M tokens (very cheap for research use)`,
        keywords: ['free', 'pricing', 'cost', 'API key']
    },
    {
        id: 'medical-advice',
        category: 'Safety',
        question: 'Can I use this for medical decisions?',
        answer: `**No. This is a research tool, not a medical device.**

**What it IS:**
- A tool for exploring biomedical relationships
- Useful for hypothesis generation in research
- Educational resource for learning pharmacology/pathophysiology
- Data source for scientific literature review

**What it is NOT:**
- A replacement for your doctor
- FDA-approved medical software
- Personalized medical advice
- A diagnostic tool

**Disclaimer:** Always consult qualified healthcare professionals for medical decisions. The data in PrimeKG comes from research databases and may not reflect the latest clinical guidelines or your specific medical situation.`,
        keywords: ['medical advice', 'safety', 'disclaimer', 'diagnosis']
    },
    {
        id: 'vs-chatgpt',
        category: 'Comparison',
        question: 'How is this different from ChatGPT for biomedical questions?',
        answer: `**Fundamental difference: Grounded vs. Generative**

| Feature | ChatGPT | PrimeKG Explorer |
|---------|---------|------------------|
| **Data Source** | Training corpus (static, 2021 cutoff) | Live knowledge graph queries |
| **Answer Method** | Predicts next word probabilistically | Retrieves verified facts |
| **Hallucination Risk** | High (invents plausible-sounding facts) | Zero (can only return real data) |
| **Citations** | Often fabricated | Always traceable to graph |
| **Drug-Disease Links** | May invent relationships | Only documented edges |
| **Best For** | General conversation, creative writing | Precision medicine research |

**Example:**
- **ChatGPT:** "Aspirin works by inhibiting COX-2 enzymes..." (might be partially wrong)
- **PrimeKG:** Returns exact proteins Aspirin targets from DrugBank, with relationship types

**When to use each:**
- Use **ChatGPT** for: Explaining concepts, writing, general questions
- Use **PrimeKG** for: Drug mechanisms, gene-disease links, repurposing hypotheses`,
        keywords: ['ChatGPT', 'comparison', 'difference', 'alternative']
    },
    {
        id: 'primekg-dataset',
        category: 'Data',
        question: 'What is PrimeKG?',
        answer: `**PrimeKG** (Precision Medicine Knowledge Graph) is a comprehensive biomedical dataset developed by the **Zitnik Lab at Harvard Medical School**.

**Stats:**
- **129,375 nodes** across 10 entity types
- **8,100,498 relationships**
- **20+ source databases** integrated

**Node Types:**
- Drugs (DrugBank)
- Diseases (MONDO, OMIM)
- Genes/Proteins (Entrez, UniProt)
- Biological Processes (GO)
- Molecular Functions
- Cellular Components
- Pathways (Reactome, KEGG)
- Phenotypes (HPO)
- Side Effects (SIDER)
- Anatomical Structures (Uberon)

**Why it's trustworthy:**
- Peer-reviewed publication: [Nature Scientific Data (2023)](https://www.nature.com/articles/s41597-023-01960-3)
- Curated from established biomedical databases
- Used in academic research worldwide
- Regularly cited in drug discovery papers

**Limitations:**
- Snapshot in time (not real-time clinical data)
- Focuses on established knowledge (not cutting-edge trials)
- English-centric entity names`,
        keywords: ['PrimeKG', 'dataset', 'Harvard', 'knowledge graph', 'data source']
    },
    {
        id: 'use-cases',
        category: 'Usage',
        question: 'What can I use this for?',
        answer: `**Research & Discovery:**
- Drug repurposing hypotheses ("What other diseases could Metformin treat?")
- Target identification ("What proteins are involved in Alzheimer's?")
- Mechanism exploration ("How does Aspirin reduce inflammation?")
- Pathway analysis ("What genes are in the insulin signaling pathway?")

**Education:**
- Learning pharmacology (drug mechanisms)
- Understanding disease biology (gene-disease links)
- Studying molecular pathways
- Preparing for exams (verified facts, not hallucinations)

**Clinical Research:**
- Literature review starting points
- Hypothesis generation for trials
- Competitive intelligence (what targets are being studied)
- Safety profiling (known side effects)

**Data Science:**
- Knowledge graph exploration
- Biomedical NLP training data
- Graph neural network experiments
- Semantic search benchmarking

**Example Queries:**
- "Show me drugs that target BRCA1"
- "What are the side effects of Statins?"
- "Find drug combinations for hypertension"
- "What phenotypes are associated with cystic fibrosis?"`,
        keywords: ['use cases', 'examples', 'queries', 'applications']
    },
    {
        id: 'web-search-mode',
        category: 'Features',
        question: 'What is Web Search Mode?',
        answer: `**Web Search Mode** lets the AI access the internet via Google Search for information beyond the PrimeKG dataset.

**When to use it:**
- Recent FDA approvals (last few months)
- Breaking news in biotech
- Clinical trial updates
- Papers published after PrimeKG's snapshot

**Trade-off:**
When Web Search is ON, the PrimeKG graph tools are **paused** to avoid conflicts.

**Why?**
Mixing "strict graph traversal" with "unstructured web text" in one query confuses the reasoning engine. We enforce a mode switch for quality.

**Recommendation:**
- **Default (Graph Mode):** For established biology, mechanisms, repurposing
- **Web Search Mode:** For news, recent trials, general literature

**Sources:**
Web Search responses include a **Sources** section with clickable links to the origin.`,
        keywords: ['web search', 'Google', 'mode', 'features']
    },
    {
        id: 'auto-grounding',
        category: 'Features',
        question: 'What is Auto-Grounding?',
        answer: `**Auto-Grounding** is the entity resolution step that maps your natural language to exact graph IDs.

**The Problem:**
- You say: "lung cancer"
- The graph knows: \`MONDO_0008903\`

**The Solution:**
When Auto-Grounding is ON:
1. The system extracts entities from your query
2. Runs semantic search to find the closest graph nodes
3. Locks onto exact IDs before executing other tools

**Example:**
Query: "Treatments for breast cancer"
- Auto-Grounding finds: \`MONDO_0007254\` (breast carcinoma)
- Then queries: \`getDrugRepurposing(disease_id="MONDO_0007254")\`

**When to turn it OFF:**
- Casual chatting (don't need graph data)
- To save tokens/cost (skips the search step)

**Indicator:**
You'll see "Auto-Grounding Active" when enabled.`,
        keywords: ['auto-grounding', 'entity resolution', 'semantic search']
    }
];
