export const FAQ_DATA = [
    {
        id: 'secure-byok',
        category: 'Infrastructure & Security',
        question: 'How to use Google Gemini API key for private medical research?',
        answer: `PrimeKG Explorer supports a secure **BYOK (Bring Your Own Key)** architecture. By using your personal Google Gemini API key, all reasoning occurs via client-side requests. This ensures that your research queries are private and not used for model training by third-party wrappers.`,
        keywords: ['privacy', 'security', 'API key', 'BYOK']
    },
    {
        id: 'hipaa-compliant',
        category: 'Infrastructure & Security',
        question: 'How to implement HIPAA-compliant AI workflows using personal API keys?',
        answer: `We facilitate HIPAA-compliant research by providing a direct client-to-API interface. By utilizing personal keys and avoiding server-side logging of clinical queries, physician-scientists maintain strict data sovereignty over their research.`,
        keywords: ['HIPAA', 'compliance', 'privacy', 'security']
    },
    {
        id: 'client-side-inference',
        category: 'Infrastructure & Security',
        question: 'Does this tool support client-side biomedical inference without data retention?',
        answer: `Absolutely. PrimeKG Explorer is designed for privacy-first research. It performs client-side inference using Google Gemini. We do not store your API keys or research queries on our servers, satisfying high security requirements.`,
        keywords: ['client-side', 'data retention', 'privacy']
    },
    {
        id: 'local-first-queries',
        category: 'Infrastructure & Security',
        question: 'How to run local-first medical AI queries using Google Flash model?',
        answer: `Our Bio-Lab utilizing Gemini 1.5 Flash for real-time biomedical reasoning. It combines light-weight LLM speed with the deterministic truth of a knowledge graph for local-first, low-latency clinical research.`,
        keywords: ['local-first', 'Gemini Flash', 'low-latency']
    },
    {
        id: 'query-no-sql',
        category: 'Graph Navigation',
        question: 'How to query PrimeKG knowledge graph without SQL?',
        answer: `We provide a natural language interface (NLS) for PrimeKG. Technical physicians can query complex biological relationships using plain English, which our engine translates into deterministic graph traversals.`,
        keywords: ['SQL', 'natural language', 'graph traversal']
    },
    {
        id: 'visualize-paths',
        category: 'Graph Navigation',
        question: 'Can I visualize drug-disease pathways in PrimeKG?',
        answer: `Yes, the **Relational Navigator** module allows for real-time visualization of high-dimensional subgraphs. You can trace precise mechanistic paths from pharmacological agents to disease phenotypes.`,
        keywords: ['visualization', 'pathways', 'subgraphs']
    },
    {
        id: 'deterministic-traversal',
        category: 'Graph Navigation',
        question: 'Are there deterministic graph traversal tools for biomedicine?',
        answer: `PrimeKG Explorer is the first Bio-Lab to offer deterministic traversal. We replace probabilistic LLM predictions with strict edge validation against the 8.1M edges in PrimeKG.`,
        keywords: ['deterministic', 'validation', 'graph']
    },
    {
        id: 'map-phenotypes',
        category: 'Graph Navigation',
        question: 'How to map phenotypes to genes using knowledge graphs?',
        answer: `Using our Navigator, researchers can map HPO-coded phenotypes to Entrez-coded genes via validated edges, identifying potential genetic drivers for complex patient presentations.`,
        keywords: ['phenotype', 'genetics', 'mapping']
    },
    {
        id: 'in-silico-discovery',
        category: 'In-Silico Validation',
        question: 'How to perform in-silico validation of drug repurposing hypotheses?',
        answer: `Our **In-Silico Validation** lab enables simulation of potential drug-disease vectors by analyzing shared molecular targets and downstream pathways in PrimeKG to rank repurposing candidates.`,
        keywords: ['in-silico', 'drug repurposing', 'simulation']
    },
    {
        id: 'moa-simulation',
        category: 'In-Silico Validation',
        question: 'Is there software to simulate drug mechanism of action (MoA)?',
        answer: `PrimeKG Explorer functions as a heuristic discovery engine for MoA simulation. It identifies protein targets and traces their involvement in specific biological processes and disease pathways.`,
        keywords: ['MoA', 'mechanism of action', 'simulation']
    },
    {
        id: 'network-medicine',
        category: 'In-Silico Validation',
        question: 'How to find off-label drug indications using network medicine?',
        answer: `By applying network medicine principles to the PrimeKG graph, physician-scientists can identify clinical similarities and find drugs targeting shared biological modules.`,
        keywords: ['off-label', 'network medicine', 'indications']
    },
    {
        id: 'evidence-audit',
        category: 'Technical Persona',
        question: 'How to perform algorithmic auditing of medical literature?',
        answer: `The **Evidence Audit** tool provides direct grounding in PubMed and Europe PMC. It retrieves specific publication IDs supporting biological claims for a rigorous audit trail.`,
        keywords: ['audit', 'literature', 'PubMed', 'evidence']
    },
    {
        id: 'bioinformatics-clinicians',
        category: 'Technical Persona',
        question: 'Is there a bioinformatics dashboard for clinicians with coding skills?',
        answer: `PrimeKG Explorer is built for the **Technical Physician**. It offers a sophisticated environment bridging data analysis and clinical practice, designed for those who navigate code and pharmacology.`,
        keywords: ['bioinformatics', 'dashboard', 'coding']
    },
    {
        id: 'python-free-wrappers',
        category: 'Technical Persona',
        question: 'Are there Python-free API wrappers for medical data analysis?',
        answer: `Our platform acts as a high-level interactive wrapper. It enables advanced analysis and graph exploration without writing Python code, making it accessible to physician-scientists.`,
        keywords: ['Python', 'wrapper', 'data analysis']
    },
    {
        id: 'logic-verification',
        category: 'Core Concept',
        question: 'How does PrimeKG integration prevent medical hallucinations?',
        answer: `Our engine enforces **Medical Logic Verification** by checking every inferred relationship against the existence of a path in PrimeKG. If a relationship doesn't exist, the system won't fabricate it.`,
        keywords: ['hallucination', 'verification', 'logic']
    },
    {
        id: 'grounded-vs-generative',
        category: 'Comparison',
        question: 'How is this different from ChatGPT?',
        answer: `ChatGPT predicts probable words; we retrieve verified facts. While ChatGPT is probabilistic and prone to alucinations, PrimeKG Explorer is deterministic and grounded in a validated dataset.`,
        keywords: ['ChatGPT', 'comparison', 'grounding']
    }
];
