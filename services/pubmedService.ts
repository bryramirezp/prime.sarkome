/**
 * PubMed/Europe PMC Service
 * Handles all interactions with the Europe PMC REST API
 * @module services/pubmedService
 */

import type { 
  Citation, 
  SearchResponse, 
  SearchParams, 
  DisplayCitation,
  PubMedError,
  EntityType
} from '../types/pubmed';
import { withRateLimit } from '../utils/rateLimiter';

const BASE_URL = 'https://www.ebi.ac.uk/europepmc/webservices/rest';
const DEFAULT_PAGE_SIZE = 10;
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * Transform raw API response to display format
 * @param raw - Raw citation data from Europe PMC API
 * @returns Transformed citation ready for UI display
 */
export function transformCitation(raw: any): DisplayCitation {
  const getPdfUrl = (): string | undefined => {
    if (!raw.fullTextUrlList?.fullTextUrl) return undefined;
    const pdfEntry = raw.fullTextUrlList.fullTextUrl.find(
      (u: any) => u.documentStyle === 'pdf' && u.availability === 'Open access'
    );
    return pdfEntry?.url;
  };

  return {
    id: raw.id,
    pmid: raw.pmid,
    doi: raw.doi,
    title: raw.title || 'Untitled',
    authors: raw.authorString || 'Unknown authors',
    journal: raw.journalTitle || raw.journalAbbreviation || 'Unknown journal',
    year: raw.pubYear || 'N/A',
    abstract: raw.abstractText,
    citedByCount: raw.citedByCount || 0,
    isOpenAccess: raw.isOpenAccess === 'Y',
    pdfUrl: getPdfUrl(),
    pmcUrl: raw.pmcid ? `https://europepmc.org/article/PMC/${raw.pmcid.replace('PMC', '')}` : undefined,
    doiUrl: raw.doi ? `https://doi.org/${raw.doi}` : undefined,
    tags: [
      raw.pubType,
      raw.isOpenAccess === 'Y' ? 'Open Access' : null,
      raw.citedByCount > 100 ? 'Highly Cited' : null,
    ].filter(Boolean) as string[],
  };
}

/**
 * Build query string with entity context and filters
 * @param params - Search parameters
 * @returns Complete query string for Europe PMC API
 */
export function buildQuery(params: SearchParams): string {
  let query = params.query;

  // Add year filter
  if (params.yearFrom || params.yearTo) {
    const from = params.yearFrom || 1900;
    const to = params.yearTo || new Date().getFullYear();
    query += ` AND PUB_YEAR:[${from} TO ${to}]`;
  }

  // Add open access filter
  if (params.openAccessOnly) {
    query += ' AND OPEN_ACCESS:y';
  }

  return query;
}

/**
 * Execute search against Europe PMC API
 * @param params - Search parameters
 * @returns Search response with transformed citations
 * @throws {PubMedError} If request fails or times out
 */
export async function searchCitations(params: SearchParams): Promise<SearchResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const query = buildQuery(params);
    const sortParam = params.sort || 'CITED desc';
    const pageSize = params.pageSize || DEFAULT_PAGE_SIZE;
    const cursor = params.cursorMark || '*';

    const url = new URL(`${BASE_URL}/search`);
    url.searchParams.set('query', query);
    url.searchParams.set('resultType', 'core');
    url.searchParams.set('pageSize', pageSize.toString());
    url.searchParams.set('cursorMark', cursor);
    url.searchParams.set('format', 'json');
    url.searchParams.set('sort', sortParam);
    url.searchParams.set('synonym', 'true');

    // Apply rate limiting before making the request
    const response = await withRateLimit(() =>
      fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      })
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      hitCount: data.hitCount || 0,
      nextCursorMark: data.nextCursorMark,
      results: (data.resultList?.result || []).map(transformCitation),
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw { 
          code: 'TIMEOUT', 
          message: 'Request timed out after 10 seconds' 
        } as PubMedError;
      }
      throw { 
        code: 'NETWORK', 
        message: error.message 
      } as PubMedError;
    }
    throw { 
      code: 'UNKNOWN', 
      message: 'An unexpected error occurred' 
    } as PubMedError;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Search for papers about a specific entity
 * @param entityName - Name of the entity (e.g., "TP53", "Metformin")
 * @param entityType - Type of entity (gene, drug, disease, pathway)
 * @param limit - Maximum number of results to return
 * @returns Array of citations about the entity
 */
export async function searchEntityCitations(
  entityName: string,
  entityType: EntityType = 'gene',
  limit: number = 5
): Promise<DisplayCitation[]> {
  // Build type-specific query
  let query: string;
  
  switch (entityType) {
    case 'gene':
      query = `${entityName} AND (gene OR protein)`;
      break;
    case 'drug':
      query = `${entityName} AND (drug OR treatment)`;
      break;
    case 'disease':
      query = `${entityName} AND (disease OR syndrome)`;
      break;
    default:
      query = entityName;
  }

  const response = await searchCitations({
    query,
    pageSize: limit,
    sort: 'CITED desc',
    // Removed strict year filter for now to ensure results
  });

  return response.results;
}

/**
 * Search for papers about a relationship between two entities
 * @param entity1 - First entity name
 * @param entity2 - Second entity name
 * @param limit - Maximum number of results to return
 * @returns Array of citations about the relationship
 */
export async function searchRelationshipCitations(
  entity1: string,
  entity2: string,
  limit: number = 5
): Promise<DisplayCitation[]> {
  const query = `("${entity1}" AND "${entity2}") AND (mechanism OR interaction OR effect OR treatment)`;

  const response = await searchCitations({
    query,
    pageSize: limit,
    sort: 'CITED desc',
  });

  return response.results;
}

/**
 * Search for drug mechanism papers
 * @param drug - Drug name
 * @param disease - Disease name
 * @param limit - Maximum number of results to return
 * @returns Array of citations about drug-disease mechanisms
 */
export async function searchMechanismCitations(
  drug: string,
  disease: string,
  limit: number = 5
): Promise<DisplayCitation[]> {
  const query = `"${drug}" AND "${disease}" AND (mechanism OR "mode of action" OR pathway OR target)`;

  const response = await searchCitations({
    query,
    pageSize: limit,
    sort: 'RELEVANCE',
  });

  return response.results;
}

/**
 * Get citation count for a specific paper
 * @param pmid - PubMed ID
 * @returns Citation count for the paper
 */
export async function getCitationCount(pmid: string): Promise<number> {
  const response = await searchCitations({
    query: `EXT_ID:${pmid}`,
    pageSize: 1,
  });

  return response.results[0]?.citedByCount || 0;
}

/**
 * Prefetch citations for multiple entities (batch optimization)
 * @param entities - Array of entities to prefetch
 * @returns Map of entity names to their citations
 */
export async function prefetchCitations(
  entities: Array<{ name: string; type: EntityType }>
): Promise<Map<string, DisplayCitation[]>> {
  const results = new Map<string, DisplayCitation[]>();

  // Execute in parallel with concurrency limit
  const CONCURRENCY = 3;
  
  for (let i = 0; i < entities.length; i += CONCURRENCY) {
    const batch = entities.slice(i, i + CONCURRENCY);
    const promises = batch.map(async (entity) => {
      const citations = await searchEntityCitations(entity.name, entity.type, 3);
      return { name: entity.name, citations };
    });

    const batchResults = await Promise.allSettled(promises);
    
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.set(result.value.name, result.value.citations);
      }
    }
  }

  return results;
}
