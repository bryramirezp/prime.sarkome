export interface KGNode {
  id: string;
  type: string;
  name: string;
  source?: string;
  db_id?: string;
  node_name?: string;
  node_type?: string;
  description?: string;
}

export interface KGEdge {
  source: string;
  target: string;
  relation: string;
  display_relation?: string;
  metadata?: any;
}

export interface GraphData {
  nodes: KGNode[];
  edges: KGEdge[];
}

export interface SearchResult {
  db_id?: string;
  name: string;
  type: string;
  score?: number;
  description?: string;
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
export interface DrugCandidate {
  drug: string;
  original_indication: string;
  shared_target: string;
  confidence: string;
  is_off_label: boolean;
  score?: number;
}

export type DrugRepurposingResponse = DrugCandidate[];

export interface TherapeuticTarget {
  gene: string;
  score: number;
  evidence_count?: number;
  uniprot_id?: string;
}

export type TherapeuticTargetsResponse = TherapeuticTarget[];

export interface DrugCombination {
  drug: string;
  score: number;
  synergy?: number;
}

export type DrugCombinationsResponse = DrugCombination[];

export interface PhenotypeCandidate {
  drug: string;
  shared_phenotypes: string[];
  overlap_score: number;
}

export type PhenotypeMatchingResponse = PhenotypeCandidate[];

export interface EnvironmentalRisk {
  exposure: string;
  exposure_type: string;
  relationship: string;
  evidence_score?: number;
}

export type EnvironmentalRiskResponse = EnvironmentalRisk[];