import toast from 'react-hot-toast';
import { 
  GraphData, 
  Stats, 
  SearchResult, 
  DrugRepurposingResponse, 
  TherapeuticTargetsResponse, 
  DrugCombinationsResponse,
  PhenotypeMatchingResponse,
  EnvironmentalRiskResponse
} from '../types';

const BASE_URL = 'https://kg.sarkome.com';

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};

// Helper to handle fetch errors with CORS support
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(new Error("Request timed out after 30s")), 30000);

    const fetchOptions: RequestInit = {
      headers,
      signal: controller.signal,
      ...options
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);

    clearTimeout(id);

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown technical error';
    console.error(`[KG Service] Error on ${endpoint}:`, message);

    // Skip global toast for 404 (Not Found) to allow components to handle it gracefully
    if (!message.includes('404')) {
      let userMessage = message;
      if (message === 'Failed to fetch') {
        userMessage = 'Connection failed. The server (kg.sarkome.com) might be down, returning a 500 error, or blocked by CORS.';
      }
      toast.error(`PrimeKG API Error: ${userMessage.slice(0, 100)}${userMessage.length > 100 ? '...' : ''}`);
    }

    throw error;
  }
}

export const kgService = {
  getHealth: (signal?: AbortSignal) => fetchAPI<{ status: string }>('/health', { signal }),

  getStats: (signal?: AbortSignal) => fetchAPI<Stats>('/stats', { signal }),

  searchText: (query: string, signal?: AbortSignal) => fetchAPI<SearchResult[]>(`/search/text?q=${encodeURIComponent(query)}`, { signal }),

  searchSemantic: (query: string, signal?: AbortSignal) => fetchAPI<SearchResult[]>(`/search/semantic?q=${encodeURIComponent(query)}`, { signal }),

  getNeighbors: (nodeId: string, signal?: AbortSignal) => fetchAPI<GraphData>(`/neighbors/${encodeURIComponent(nodeId)}`, { signal }),

  getSubgraph: (entity: string, hops: number = 1, limit: number = 50, signal?: AbortSignal) =>
    fetchAPI<GraphData>(`/subgraph/${encodeURIComponent(entity)}?hops=${hops}&limit=${limit}`, { signal }),


  getShortestPath: (source: string, target: string, signal?: AbortSignal) => fetchAPI<GraphData>(`/path/${encodeURIComponent(source)}/${encodeURIComponent(target)}`, { signal }),

  getDrugRepurposing: (disease: string, signal?: AbortSignal) => fetchAPI<DrugRepurposingResponse>(`/hypothesis/repurposing/${encodeURIComponent(disease)}`, { signal }),

  getTherapeuticTargets: (disease: string, signal?: AbortSignal) => fetchAPI<TherapeuticTargetsResponse>(`/hypothesis/targets/${encodeURIComponent(disease)}`, { signal }),

  getDrugCombinations: (drug: string, signal?: AbortSignal) => fetchAPI<DrugCombinationsResponse>(`/hypothesis/combinations/${encodeURIComponent(drug)}`, { signal }),

  getDrugMechanism: (drug: string, disease: string, signal?: AbortSignal) => fetchAPI<GraphData>(`/hypothesis/mechanisms/${encodeURIComponent(drug)}/${encodeURIComponent(disease)}`, { signal }),

  getPhenotypeMatching: (disease: string, signal?: AbortSignal) =>
    fetchAPI<PhenotypeMatchingResponse>(`/hypothesis/phenotypes/${encodeURIComponent(disease)}`, { signal }),

  getEnvironmentalRisks: (disease: string, signal?: AbortSignal) =>
    fetchAPI<EnvironmentalRiskResponse>(`/risk/environmental/${encodeURIComponent(disease)}`, { signal }),

  getContext: (signal?: AbortSignal) => fetchAPI<any>('/context', { signal }),

  getToolSchema: (signal?: AbortSignal) => fetchAPI<any>('/tools/schema', { signal }),
};