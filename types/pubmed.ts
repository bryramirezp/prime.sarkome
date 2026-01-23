/**
 * TypeScript types and interfaces for PubMed/Europe PMC integration
 * @module types/pubmed
 */

/**
 * Author information from Europe PMC
 */
export interface Author {
  firstName?: string;
  lastName?: string;
  initials?: string;
  authorId?: {
    type: 'ORCID' | 'OTHER';
    value: string;
  };
  affiliation?: string;
}

/**
 * Full text URL information
 */
export interface FullTextUrl {
  availability: 'Open access' | 'Subscription required' | 'Free';
  documentStyle: 'pdf' | 'html' | 'doi';
  site: string;
  url: string;
}

/**
 * MeSH heading (Medical Subject Heading)
 */
export interface MeshHeading {
  descriptorName: string;
  majorTopic?: boolean;
}

/**
 * Core citation data from Europe PMC
 */
export interface Citation {
  // Identifiers
  id: string;
  source: 'MED' | 'PMC' | 'PAT' | 'ETH' | 'HIR' | 'CTX' | 'CBA' | 'AGR' | 'PPR';
  pmid?: string;
  pmcid?: string;
  doi?: string;
  
  // Basic metadata
  title: string;
  authorString: string;
  authors?: Author[];
  journalTitle: string;
  journalAbbreviation?: string;
  journalIssn?: string;
  pubYear: string;
  pubType?: string;
  pageInfo?: string;
  volume?: string;
  issue?: string;
  
  // Access information
  isOpenAccess: boolean;
  hasPDF: boolean;
  hasFullText: boolean;
  fullTextUrls?: FullTextUrl[];
  
  // Content
  abstractText?: string;
  language?: string;
  keywords?: string[];
  meshHeadings?: MeshHeading[];
  
  // Metrics
  citedByCount: number;
  firstPublicationDate: string;
  
  // Affiliation
  affiliation?: string;
}

/**
 * Search response from Europe PMC
 */
export interface SearchResponse {
  hitCount: number;
  nextCursorMark?: string;
  results: DisplayCitation[];
}

/**
 * Search parameters
 */
export interface SearchParams {
  query: string;
  pageSize?: number;
  cursorMark?: string;
  sort?: 'CITED desc' | 'DATE desc' | 'RELEVANCE';
  openAccessOnly?: boolean;
  yearFrom?: number;
  yearTo?: number;
}

/**
 * Transformed citation for UI display
 */
export interface DisplayCitation {
  id: string;
  pmid?: string;
  doi?: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  abstract?: string;
  citedByCount: number;
  isOpenAccess: boolean;
  pdfUrl?: string;
  pmcUrl?: string;
  doiUrl?: string;
  tags: string[];
}

/**
 * Loading state for async operations
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Error codes for PubMed operations
 */
export type ErrorCode = 'NETWORK' | 'TIMEOUT' | 'RATE_LIMIT' | 'INVALID_QUERY' | 'UNKNOWN';

/**
 * Error with context
 */
export interface PubMedError {
  code: ErrorCode;
  message: string;
  retryAfter?: number;
}

/**
 * Entity types supported for literature search
 */
export type EntityType = 'gene' | 'drug' | 'disease' | 'pathway';

/**
 * Query builder for common patterns
 */
export interface QueryBuilder {
  entity: (name: string, type?: EntityType) => string;
  relationship: (entity1: string, entity2: string) => string;
  mechanism: (drug: string, disease: string) => string;
  recentYears: (years: number) => string;
}
