import React from 'react';
import DocsSidebar from '../components/DocsSidebar';


interface PrimeKGPageProps {
  darkMode: boolean;
}


interface NodeType {
  type: string;
  count: string;
  source: string;
  color: string;
}

interface EdgeType {
  name: string;
  count: string;
  highlight?: boolean;
  desc?: string;
}

interface ApiTool {
  name: string;
  label: string;
  endpoint: string;
  desc: string;
  icon: string;
  color: string;
}

// Static Data Definitions
const NODE_TYPES: NodeType[] = [
  { type: "Biological Process", count: "28,642", source: "Gene Ontology (GO)", color: "indigo" },
  { type: "Gene/Protein", count: "27,671", source: "Entrez Gene IDs", color: "blue" },
  { type: "Disease", count: "17,074", source: "Mondo Disease Ontology", color: "red" },
  { type: "Phenotype", count: "15,303", source: "Human Phenotype Ontology", color: "amber" },
  { type: "Anatomy", count: "14,027", source: "UBERON Ontology", color: "emerald" },
  { type: "Molecular Function", count: "11,169", source: "Gene Ontology (GO)", color: "purple" },
  { type: "Drug", count: "7,956", source: "DrugBank IDs", color: "pink" },
  { type: "Cellular Component", count: "4,176", source: "Gene Ontology (GO)", color: "cyan" },
  { type: "Pathway", count: "2,489", source: "Reactome", color: "orange" },
  { type: "Exposure", count: "755", source: "MeSH", color: "lime" },
];

const EDGE_TYPES: EdgeType[] = [
  { name: "Anatomy → Protein", count: "3.0M", highlight: true },
  { name: "Drug ↔ Drug", count: "2.7M", highlight: true },
  { name: "Protein ↔ Protein", count: "642K" },
  { name: "Disease → Phenotype", count: "301K" },
  { name: "BioProcess → Protein", count: "290K" },
  { name: "Cell Comp → Protein", count: "167K" },
  { name: "Disease → Protein", count: "161K" },
  { name: "MolFunc → Protein", count: "139K" },
  { name: "Drug → Phenotype", count: "130K", desc: "Side effects" },
  { name: "Pathway → Protein", count: "85K" },
  { name: "Drug ⊗ Disease", count: "61K", desc: "Contraindication", highlight: true },
  { name: "Drug → Protein", count: "51K", desc: "Targets" },
  { name: "Drug ✓ Disease", count: "19K", desc: "Indication", highlight: true },
  { name: "Drug ~ Disease", count: "5.1K", desc: "Off-label" },
  { name: "Exposure → Disease", count: "4.6K" },
];

const API_TOOLS: ApiTool[] = [
  {
    name: "search_biomedical_entities",
    label: "Semantic Search",
    endpoint: "/search/semantic",
    desc: "Search for biomedical entities (drugs, diseases, genes, proteins, pathways) using semantic AI search with natural language queries.",
    icon: "manage_search",
    color: "indigo"
  },
  {
    name: "get_entity_relationships",
    label: "Get Neighbors",
    endpoint: "/neighbors/{entity}",
    desc: "Get all relationships (neighbors) of a biomedical entity. Shows what drugs treat diseases, what genes are targeted, etc.",
    icon: "hub",
    color: "blue"
  },
  {
    name: "find_connection",
    label: "Find Connections",
    endpoint: "/path/{entity1}/{entity2}",
    desc: "Find how two biomedical entities are connected. Useful for understanding drug-disease relationships with path lengths 1-3 hops.",
    icon: "route",
    color: "emerald"
  },
  {
    name: "find_drug_repurposing_candidates",
    label: "Drug Repurposing",
    endpoint: "/hypothesis/repurposing/{disease}",
    desc: "Find existing drugs that could potentially treat a disease based on shared molecular targets and pathways.",
    icon: "medication_liquid",
    color: "purple"
  },
  {
    name: "find_therapeutic_targets",
    label: "Target Discovery",
    endpoint: "/hypothesis/targets/{disease}",
    desc: "Find potential therapeutic targets (genes/proteins) for a disease, ranked by existing drug coverage and druggability.",
    icon: "target",
    color: "red"
  },
  {
    name: "explain_drug_mechanism",
    label: "Mechanism Explain",
    endpoint: "/hypothesis/mechanisms/{drug}/{disease}",
    desc: "Explain the molecular mechanism of how a drug affects a disease, showing the step-by-step pathway through proteins and processes.",
    icon: "lightbulb",
    color: "amber"
  },
  {
    name: "get_subgraph",
    label: "Subgraph Extraction",
    endpoint: "/subgraph/{entity}",
    desc: "Extract a mini-graph around an entity for visualization or analysis. Configurable neighborhood depth (1-3 hops) and node limits.",
    icon: "dataset",
    color: "pink"
  }
];

const ONTOLOGIES = ["Mondo", "HPO", "Gene Ontology", "UBERON", "Disease Ontology", "UMLS", "CTD"];

export default function PrimeKGPage({ darkMode }: PrimeKGPageProps) {
  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-zinc-950 text-slate-200' : 'bg-slate-50 text-slate-900'}`}>

      {/* Docs Sidebar */}
      <DocsSidebar darkMode={darkMode} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 bg-background overflow-y-auto scrollbar-thin">
        <div className="w-full max-w-6xl mx-auto transition-colors duration-300 pb-8 sm:pb-12">

          {/* Hero Header - improved visual hierarchy */}
          <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-10 md:py-14">
            <div className="flex items-start gap-3 sm:gap-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                <img alt="cow" className="w-8 h-8 brightness-110 contrast-125 hue-rotate-[280deg]" src="https://em-content.zobj.net/source/twitter/376/cow-face_1f42e.png" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary tracking-tight">
                  PrimeKG Knowledge Graph
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-secondary mt-2 leading-relaxed">
                  Biomedical Knowledge Graph API for drug discovery, target identification, and mechanism exploration. Contains 129K+ entities and 8.1M+ relationships from PrimeKG.
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                  <a
                    href="https://zitniklab.hms.harvard.edu/projects/PrimeKG/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition-all hover-lift"
                  >
                    <span className="material-symbols-outlined text-[16px]">science</span>
                    Zitnik Lab
                  </a>
                  <a
                    href="https://kg.sarkome.com/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition-all hover-lift"
                  >
                    <span className="material-symbols-outlined text-[16px]">api</span>
                    API Docs
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Content sections */}
          <div className="px-4 sm:px-6 md:px-8 space-y-6 sm:space-y-8 md:space-y-10">

            {/* Section 1: Scale - Redesigned stat cards */}
            <section className="animate-fade-in">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-blue-400">analytics</span>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-primary">Graph Scale</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20 hover:border-indigo-500/40 transition-all hover-lift">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 font-mono">129,262</div>
                  <div className="text-xs sm:text-sm font-medium text-indigo-400 uppercase tracking-wide">Total Nodes</div>
                  <div className="text-[10px] sm:text-xs text-tertiary mt-1 sm:mt-2">Biological entities across 10 categories</div>
                </div>
                <div className="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 transition-all hover-lift">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 font-mono">8.1M</div>
                  <div className="text-xs sm:text-sm font-medium text-purple-400 uppercase tracking-wide">Relationships</div>
                  <div className="text-[10px] sm:text-xs text-tertiary mt-1 sm:mt-2">30 different edge types</div>
                </div>
                <div className="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all hover-lift sm:col-span-2 md:col-span-1">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 font-mono">99.99%</div>
                  <div className="text-xs sm:text-sm font-medium text-emerald-400 uppercase tracking-wide">Connected</div>
                  <div className="text-[10px] sm:text-xs text-tertiary mt-1 sm:mt-2">Giant connected component</div>
                </div>
              </div>
            </section>

            {/* Section 2: Node Types - Improved table design */}
            <section>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-purple-400">category</span>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-primary">Biological Node Types</h2>
                <span className="px-2 py-0.5 text-[10px] font-medium text-purple-400 bg-purple-500/10 rounded-full">10 Categories</span>
              </div>
              <div className="rounded-xl sm:rounded-2xl border border-border overflow-x-auto bg-surface/30">
                <table className="w-full text-sm min-w-[280px]">
                  <thead>
                    <tr className="border-b border-border bg-surface/50">
                      <th className="text-left font-semibold text-secondary px-3 sm:px-5 py-3 sm:py-4 text-[10px] sm:text-xs uppercase tracking-wider">Node Type</th>
                      <th className="text-right font-semibold text-secondary px-3 sm:px-5 py-3 sm:py-4 text-[10px] sm:text-xs uppercase tracking-wider">Count</th>
                      <th className="text-left font-semibold text-secondary px-3 sm:px-5 py-3 sm:py-4 text-[10px] sm:text-xs uppercase tracking-wider hidden md:table-cell">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {NODE_TYPES.map((row) => (
                      <tr key={row.type} className="hover:bg-surface/50 transition-colors">
                        <td className="px-3 sm:px-5 py-2.5 sm:py-3.5">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className={`w-2 h-2 rounded-full bg-${row.color}-400 flex-shrink-0`}></div>
                            <span className="font-medium text-primary text-xs sm:text-sm">{row.type}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-5 py-2.5 sm:py-3.5 text-right">
                          <span className="font-mono text-primary text-xs sm:text-sm">{row.count}</span>
                        </td>
                        <td className="px-3 sm:px-5 py-2.5 sm:py-3.5 text-tertiary text-xs hidden md:table-cell">{row.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 2.5: Semantic Search - Improved card design */}
            <section>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-pink-400">psychology</span>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-primary">Semantic Retrieval</h2>
                <span className="px-2 py-0.5 text-[10px] font-medium text-pink-400 bg-pink-500/10 rounded-full">AI-Powered</span>
              </div>
              <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-border bg-gradient-to-br from-surface/50 to-transparent">
                <p className="text-secondary text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
                  PrimeAI uses <strong className="text-primary">Google Gemini Embeddings</strong> to enable semantic search across the entire knowledge graph.
                  Instead of keyword matching, embeddings capture the semantic meaning of biomedical concepts in high-dimensional vector space.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="p-4 sm:p-5 rounded-xl bg-surface/50 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-blue-400">search</span>
                      <h4 className="font-semibold text-primary text-sm">How It Works</h4>
                    </div>
                    <ul className="space-y-2 text-xs sm:text-sm text-secondary">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1 flex-shrink-0">→</span>
                        <span>Natural language question converted to embedding</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1 flex-shrink-0">→</span>
                        <span>Similar nodes retrieved via cosine similarity</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1 flex-shrink-0">→</span>
                        <span>Results ranked by semantic relevance</span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-4 sm:p-5 rounded-xl bg-surface/50 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-emerald-400">check_circle</span>
                      <h4 className="font-semibold text-primary text-sm">Key Benefits</h4>
                    </div>
                    <ul className="space-y-2 text-xs sm:text-sm text-secondary">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-1 flex-shrink-0">✓</span>
                        <span>Understands synonyms and related concepts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-1 flex-shrink-0">✓</span>
                        <span>Robust to natural language variations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-1 flex-shrink-0">✓</span>
                        <span>Efficient across 129K+ nodes</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                  <p className="text-xs sm:text-sm text-secondary">
                    <span className="font-semibold text-indigo-400">Example:</span> "neurodegenerative disease," "Alzheimer's," and "dementia" are recognized as semantically related—enabling discovery of relevant drug targets without exact keyword matches.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3: Edge Types - Compact grid */}
            <section>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-orange-400">share</span>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-primary">Relationship Types</h2>
                <span className="px-2 py-0.5 text-[10px] font-medium text-orange-400 bg-orange-500/10 rounded-full">30 Edge Types</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {EDGE_TYPES.map((edge) => (
                  <div
                    key={edge.name}
                    className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border flex items-center justify-between transition-all hover:scale-[1.02] ${edge.highlight
                      ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-500/40'
                      : 'bg-surface/30 border-border hover:border-zinc-600'
                      }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] sm:text-xs font-medium text-primary truncate">{edge.name}</div>
                      {edge.desc && <div className="text-[9px] sm:text-[10px] text-tertiary">{edge.desc}</div>}
                    </div>
                    <div className="font-mono text-[10px] sm:text-xs text-secondary pl-2 sm:pl-3 flex-shrink-0">{edge.count}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 4: Data Sources - Improved layout */}
            <section>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-emerald-400">database</span>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-primary">Data Sources</h2>
                <span className="px-2 py-0.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 rounded-full">20 Gold-Standard</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-surface/30 border border-border">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-red-400">medication</span>
                    <h3 className="font-semibold text-primary text-sm sm:text-base">Clinical & Drugs</h3>
                  </div>
                  <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-secondary">
                    <li>
                      <a href="https://go.drugbank.com/" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:text-accent transition-colors">
                        DrugBank
                      </a> — Drugs, pharmacology, targets
                    </li>
                    <li>
                      <a href="https://drugcentral.org/" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:text-accent transition-colors">
                        Drug Central
                      </a> — Indications, contraindications
                    </li>
                    <li>
                      <a href="https://www.mayoclinic.org/" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:text-accent transition-colors">
                        Mayo Clinic
                      </a> — Clinical descriptions
                    </li>
                    <li>
                      <a href="https://www.orpha.net/" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:text-accent transition-colors">
                        Orphanet
                      </a> — Rare diseases
                    </li>
                    <li>
                      <a href="http://sideeffects.embl.de/" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:text-accent transition-colors">
                        SIDER
                      </a> — Side effects (ADRs)
                    </li>
                  </ul>
                </div>
                <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-surface/30 border border-border">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-blue-400">genetics</span>
                    <h3 className="font-semibold text-primary text-sm sm:text-base">Genomics & Proteomics</h3>
                  </div>
                  <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-secondary">
                    <li>
                      <a href="https://www.disgenet.org/" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:text-accent transition-colors">
                        DisGeNET
                      </a> — Gene-disease associations
                    </li>
                    <li>
                      <a href="https://www.ncbi.nlm.nih.gov/gene" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:text-accent transition-colors">
                        Entrez Gene
                      </a> — Gene information (NCBI)
                    </li>
                    <li>
                      <a href="https://www.bgee.org/" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:text-accent transition-colors">
                        Bgee
                      </a> — Gene expression patterns
                    </li>
                    <li>
                      <span className="text-primary font-medium">PPI Networks</span> —
                      <a href="https://thebiogrid.org/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline ml-1">BioGRID</a>,
                      <a href="https://string-db.org/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline ml-1">STRING</a>,
                      <a href="http://www.interactome-atlas.org/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline ml-1">HuRI</a>
                    </li>
                    <li>
                      <a href="https://reactome.org/" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:text-accent transition-colors">
                        Reactome
                      </a> — Biological pathways
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-surface/20 border border-border">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <span className="material-symbols-outlined text-[14px] sm:text-[16px] text-purple-400">sell</span>
                  <h4 className="font-medium text-primary text-xs sm:text-sm">Ontologies & Vocabularies</h4>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {ONTOLOGIES.map((s) => (
                    <span key={s} className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-secondary bg-surface/50 rounded-lg border border-border">{s}</span>
                  ))}
                </div>
              </div>
            </section>
            {/* Section 5: API Tools and Capabilities */}
            <section>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-amber-400">api</span>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-primary">API Tools & Capabilities</h2>
                <span className="px-2 py-0.5 text-[10px] font-medium text-amber-400 bg-amber-500/10 rounded-full">v2.1.0</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {API_TOOLS.map((tool) => (
                  <div key={tool.name} className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-${tool.color}-500/10 to-transparent border border-${tool.color}-500/20 hover:border-${tool.color}-500/40 transition-all hover-lift`}>
                    <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-${tool.color}-500/10 flex items-center justify-center flex-shrink-0`}>
                        <span className={`material-symbols-outlined text-[18px] sm:text-[20px] text-${tool.color}-400`}>{tool.icon}</span>
                      </div>
                      <code className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-surface/50 border border-border text-secondary font-mono break-all`}>
                        {tool.endpoint}
                      </code>
                    </div>
                    <h3 className="font-semibold text-primary mb-1 text-sm sm:text-base">{tool.label}</h3>
                    <div className={`text-[10px] sm:text-xs font-mono text-${tool.color}-400 mb-2 opacity-80`}>{tool.name}</div>
                    <p className="text-xs sm:text-sm text-secondary leading-relaxed">{tool.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Citation Footer */}
            <section className="mt-8 sm:mt-12 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 border border-indigo-500/10">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px] sm:text-[24px] text-indigo-400">school</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-primary mb-2 text-sm sm:text-base">Citation & References</h3>
                  <p className="text-xs sm:text-sm text-secondary mb-3 sm:mb-4">
                    PrimeKG was developed by the <strong className="text-primary">Zitnik Lab at Harvard Medical School</strong> to enable systematic evaluation of drug repurposing and precision medicine applications.
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <a href="https://zitniklab.hms.harvard.edu/projects/PrimeKG/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                      <span className="material-symbols-outlined text-[14px] sm:text-[16px]">open_in_new</span>
                      <span>Project Page</span>
                    </a>
                    <a href="https://kg.sarkome.com/docs" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-purple-400 hover:text-purple-300 transition-colors">
                      <span className="material-symbols-outlined text-[14px] sm:text-[16px]">api</span>
                      <span>API Documentation</span>
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

