# PrimeKG Precision Medicine Explorer

**Accelerating drug discovery and precision medicine with AI-powered biomedical knowledge graph exploration**

[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Neo4j](https://img.shields.io/badge/Neo4j-008CC1?style=flat&logo=neo4j&logoColor=white)](https://neo4j.com/)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=flat&logo=google-cloud&logoColor=white)](https://cloud.google.com/)
[![Gemini](https://img.shields.io/badge/Gemini_3.0-8E75B2?style=flat&logo=google&logoColor=white)](https://ai.google.dev/)

</div>

---

## Inspiration

The journey from identifying a disease to finding an effective treatment can take **10-15 years** and cost **billions of dollars**. With over 10,000 known diseases but treatments for only a fraction, researchers desperately need better tools to explore connections between drugs, genes, proteins, and diseases.

**PrimeKG** (Precision Medicine Knowledge Graph) contains **129,375 biomedical entities** and over **8 million relationships** — but navigating this treasure trove of knowledge requires expertise and time. We asked ourselves: *What if researchers could simply chat with the knowledge graph?*

Our inspiration came from watching researchers struggle with complex database queries when the questions they wanted to ask were simple human language: *"What drugs might work for Autism Spectrum Disorder?"* or *"Show me the mechanism between Sirolimus and cancer."*

---

## What it does

**PrimeKG Explorer** is an AI-powered conversational interface that transforms how researchers interact with biomedical knowledge graphs. Think of it as **ChatGPT meets PubMed meets DrugBank** — but smarter and more specialized.

### Core Capabilities

**Intelligent Search**
- **Text Search**: Fast literal matching across 129k biomedical entities
- **Semantic Search**: AI-powered understanding using Google Gemini embeddings
- Find diseases, drugs, genes, proteins, pathways, and biological processes

**Drug Repurposing**
- Discover existing drugs that could treat new diseases
- Ranked by computational druggability scores
- Explore 1-3 hop pathways between drugs and disease targets

**Therapeutic Target Discovery**
- Identify genes and proteins suitable for drug development
- Understand biological mechanisms and pathways
- Druggability assessments based on network topology

**Molecular Mechanism Visualization**
- Trace step-by-step pathways: Drug → Protein → Pathway → Disease
- Understand how treatments work at a molecular level
- Multi-hop relationship exploration

**Knowledge Graph Navigation**
- Get neighboring nodes (1-hop connections)
- Find all paths between entities (up to 3 hops)
- Extract disease-specific subgraphs

### Smart Features

**Prompt Enhancement**: AI automatically refines vague queries into precise biomedical questions  
**Multi-Session Management**: Track multiple research threads simultaneously  
**Adaptive UI**: Beautiful light/dark modes optimized for long research sessions  
**Live Trace Visualization**: Watch AI reasoning in real-time as it queries the knowledge graph  
**Collapsible Insights**: Expand/collapse detailed tool execution logs

---

## � Built With

This project leverages cutting-edge technologies across the full stack:

### AI & Machine Learning
- **Google Gemini 3.0** - Advanced language models with function calling capabilities
  - `gemini-3-flash-preview` - Primary conversational AI
  - `gemini-3-pro-preview` - Complex reasoning tasks
  - `gemini-2.0-flash` - Prompt enhancement

### Database & Knowledge Graph
- **Neo4j** - Graph database powering PrimeKG's 129k nodes and 8M+ relationships
- **Vector Embeddings** - Semantic search via Gemini embeddings

### Backend & APIs
- **Python** - PrimeKG API server and knowledge graph processing
- **Google Cloud Platform (GCP)** - Cloud infrastructure and deployment
  - Compute Engine for API hosting
  - Cloud Storage for biomedical datasets
  - Vertex AI integration

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first styling

### Additional Technologies
- **@google/genai SDK** (v1.36.0) - Gemini API integration
- **React Markdown** + **remark-gfm** - Rich content rendering
- **localStorage API** - Client-side persistence

---

## How we built it

### Architecture

```
Frontend (React + TypeScript + Vite)
        ↓
Google Gemini AI (Function Calling)
        ↓
PrimeKG API v2.1.0 (Knowledge Graph)
```

### Tech Stack

**Frontend Framework**
- **React 18** with TypeScript for type-safe development
- **Vite** for blazing-fast HMR and optimized builds
- **Tailwind CSS** via CDN for rapid, responsive styling

**AI Integration**
- **Google Gemini** (`@google/genai` v1.36.0)
  - `gemini-3-flash-preview`: Primary chat model
  - `gemini-3-pro-preview`: Advanced reasoning
  - `gemini-2.0-flash`: Prompt enhancement engine
- **Function Calling**: 7 specialized tools for PrimeKG queries

**Knowledge Graph**
- **PrimeKG API v2.1.0**: RESTful interface to biomedical knowledge
- Endpoints: `/search/text`, `/search/semantic`, `/hypothesis/*`, `/graph/*`
- 129,375 nodes | 8+ million relationships

**State Management**
- React Hooks (`useState`, `useEffect`, `useRef`)
- localStorage for persistence (API keys, sessions, themes)
- Session-based architecture with forced re-renders

**Key Design Decisions**
1. **No backend required**: Direct Gemini API calls from browser
2. **Always-on tools**: All PrimeKG capabilities available in every query
3. **Real-time streaming**: Live trace updates during AI processing
4. **Auto-resize UX**: Textarea grows with content (up to 2x)
5. **Monospace tracing**: Console-style logs for developer transparency

### Development Process

```bash
# Initial scaffold with Vite
npm create vite@latest primekg-explorer -- --template react-ts

# Core dependencies
npm install @google/genai react-markdown remark-gfm

# CSS framework (CDN-based Tailwind)
# Added via <link> in index.html for zero-config setup
```

---

## Challenges we ran into

### 1. **Gemini Function Calling Complexity**
**Problem**: Managing 7+ tools with complex parameters while keeping context windows manageable.

**Solution**: Created a centralized `toolRegistry.ts` with strict TypeScript interfaces. Implemented auto-task system that intelligently triggers text + semantic search for every query.

### 2. **State Management Without Full Reloads**
**Problem**: Early versions used `window.location.reload()` for session switching — felt clunky and slow.

**Solution**: Introduced `sessionKey` counter that forces React re-renders without page reloads. True SPA behavior achieved.

### 3. **Real-time Trace Updates**
**Problem**: Gemini streaming doesn't expose intermediate function calls until completion.

**Solution**: Built custom trace aggregation system that captures tool calls, API endpoints, and results. Updates `liveTrace` state array in real-time with collapsible UI.

### 4. **Light Mode Readability**
**Problem**: Default Zinc-500/600 text colors had poor contrast in light mode.

**Solution**: Migrated to Zinc-950/800/600 palette with conditional styling for API key banners. Now meets WCAG AA standards.

### 5. **Auto-resize Textarea**
**Problem**: Fixed-height inputs hide long prompts, breaking user flow.

**Solution**: Added `textareaRef` with `useEffect` hook that dynamically sets height based on `scrollHeight`. Capped at 2x original size (104px) to prevent UI overflow.

### 6. **Nested Button JSX Errors**
**Problem**: Session items had buttons within buttons (invalid HTML).

**Solution**: Refactored Sidebar to use `<div>` containers with `cursor-pointer` for outer elements, keeping action buttons isolated.

---

## Accomplishments that we're proud of

- **Zero-config deployment**: No backend, no database, no build complexity  
- **Production-ready UX**: Polish level rarely seen in hackathon projects  
- **Advanced AI integration**: Proper function calling with 7 specialized tools  
- **Accessibility**: WCAG AA compliant, keyboard navigation, semantic HTML  
- **Performance**: Sub-100ms UI updates, optimized re-renders  
- **Developer experience**: Fully typed with TypeScript, clean architecture  
- **Real scientific utility**: Already tested with actual biomedical queries  

### The "Wow" Moments

- Watching the AI autonomously chain 10+ tool calls to answer *"Find mTOR inhibitors for Autism Spectrum Disorder"*

- Building a trace visualization that's both beautiful AND informative

- Achieving true SPA performance without a complex state management library

---

## What we learned

### Technical Insights

1. **Gemini Function Calling is Powerful**: When given good tool descriptions, the model makes remarkably intelligent decisions about which APIs to call and in what order.

2. **TypeScript Pays Off**: Strict typing caught dozens of bugs before runtime, especially in API integrations and tool parameters.

3. **CSS Variables > Hardcoded Colors**: Theme switching became trivial with `--color-*` variables and Tailwind's `rgb(var(--color-*))` syntax.

4. **localStorage is Underrated**: For single-user research tools, localStorage provides instant persistence without server complexity.

5. **Auto-resize UX Details Matter**: Small touches like dynamic textarea height dramatically improve user experience.

### Domain Knowledge

- **PrimeKG's structure**: Understanding node types (Disease, Drug, Gene/Protein, Pathway, Biological Process) and relationship semantics
- **Druggability metrics**: How computational scores rank therapeutic targets
- **Multi-hop reasoning**: Why 1-3 hop paths are the sweet spot for mechanism exploration

### AI Engineering

- **Prompt engineering for tools**: Descriptive tool names + detailed descriptions + clear parameter schemas = better function calling
- **Context window management**: Balancing comprehensive system prompts with room for conversation history
- **Streaming vs. blocking**: When to use each pattern for optimal UX

---

## What's next for prime.sarkome.com

### Short-term (Next 2 Weeks)

**User Authentication**: Firebase Auth for multi-user support  
**Cloud History Sync**: Store sessions in Firestore  
**Export Capabilities**: Download conversations as PDF/Markdown  
**Advanced Visualizations**: Interactive network graphs with D3.js/Cytoscape

### Medium-term (1-3 Months)

**Multi-modal Support**: Upload PDFs, images (protein structures, pathway diagrams)  
**Agent Mode**: Autonomous research workflows (e.g., "Find all mTOR inhibitors, check side effects, rank by safety")  
**Citation Tracking**: Link results to PubMed articles and clinical trials  
**Alert System**: Notify when new drugs/studies match saved queries

### Long-term Vision

**Expand Knowledge Graphs**: Integrate SPOKE, Hetionet, STRING databases  
**Clinical Trial Matching**: Connect patients with relevant studies  
**EHR Integration**: FHIR-compatible clinical decision support  
**Educational Platform**: Tutorials for researchers learning computational drug discovery

### Research Directions

- **Federated Learning**: Privacy-preserving queries across institutional knowledge graphs
- **Explainable AI**: Transparent reasoning chains for FDA/regulatory approval
- **Drug Synergy Prediction**: ML models to identify promising combination therapies

---

## Run Locally

**Prerequisites**: Node.js 18+ 

### Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd primekg-precision-medicine-explorer

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Configuration

Click the **⚙️ API Key** button in the app to set your Google Gemini API key. Get one free at [ai.google.dev](https://ai.google.dev/).

---

## Project Structure

```
primekg-precision-medicine-explorer/
├── components/
│   ├── ChatInterface.tsx    # Main chat UI + trace visualization
│   ├── Sidebar.tsx          # Session management
│   ├── ApiKeyModal.tsx      # API key configuration
│   └── DeleteConfirmationModal.tsx
├── pages/
│   ├── ChatPage.tsx         # Chat route wrapper
│   └── PrimeKGPage.tsx      # API documentation
├── services/
│   ├── geminiService.ts     # Gemini AI integration
│   └── kgService.ts         # PrimeKG API client
├── constants/
│   └── toolRegistry.ts      # Function calling tools
├── utils/
│   └── security.ts          # API key encryption
├── types.ts                 # TypeScript interfaces
└── App.tsx                  # Root component + routing
```

---

## Contributing

We welcome contributions! Areas we'd love help with:

- **Testing**: Unit tests for services, E2E with Playwright
- **Accessibility**: Screen reader optimization, keyboard shortcuts
- **Design**: Additional themes, mobile responsiveness
- **Documentation**: Tutorials, API guides, video walkthroughs

---

## License

MIT License - see [LICENSE](LICENSE) for details

---

## Citation

If you use PrimeKG or find this project useful in your research, please cite:

```bibtex
@article{chandak2022building,
  title={Building a knowledge graph to enable precision medicine},
  author={Chandak, Payal and Huang, Kexin and Zitnik, Marinka},
  journal={Nature Scientific Data},
  doi={https://doi.org/10.1038/s41597-023-01960-3},
  URL={https://www.nature.com/articles/s41597-023-01960-3},
  year={2023}
}
```

**PrimeKG Project**: [https://zitniklab.hms.harvard.edu/projects/PrimeKG/](https://zitniklab.hms.harvard.edu/projects/PrimeKG/)

---

## Acknowledgments

- **PrimeKG Team**: For creating and maintaining this incredible biomedical knowledge graph
- **Google Gemini**: For powerful AI models with function calling
- **Harvard Medical School**: Original PrimeKG research
- **Open source community**: React, Vite, Tailwind CSS, and countless other tools

---

<div align="center">

**Built with ❤️ for researchers pushing the boundaries of precision medicine**

</div>
