export interface KGNode {
  id: string;
  type: string;
  name: string;
  source?: string;
}

export interface KGEdge {
  source: string;
  target: string;
  relation: string;
  display_relation?: string;
}

export interface GraphData {
  nodes: KGNode[];
  edges: KGEdge[];
}

export interface SearchResult {
  node_id: string;
  node_name: string;
  node_type: string;
  score?: number;
}

export enum GeminiModel {
  FLASH = 'gemini-3-flash-preview',
  PRO = 'gemini-3-pro-preview',
  FLASH_2_0_EXP = 'gemini-2.0-flash-exp',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: Date;
  isError?: boolean;
  relatedData?: any; // To store graphs or structured data returned by tools
  trace?: string[]; // Tool-call / retrieval trace shown in UI (not chain-of-thought)
}

export interface Stats {
  node_count: number;
  edge_count: number;
  disease_count: number;
  drug_count: number;
}

// Response types from PrimeKG API
export interface DrugRepurposingResponse {
  disease: string;
  candidates: Array<{ drug: string; score: number; mechanism_strength?: number }>;
}

export interface TherapeuticTargetsResponse {
  disease: string;
  targets: Array<{ gene: string; score: number; evidence_count?: number }>;
}

export interface DrugCombinationsResponse {
  drug: string;
  combinations: Array<{ drug: string; score: number; synergy?: number }>;
}