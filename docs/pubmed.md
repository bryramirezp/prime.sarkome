# 📚 PubMed / Europe PMC Integration Guide

> **Comprehensive documentation for integrating scientific literature into PrimeKG Explorer**

---

## Table of Contents

1. [Executive Summary](#-executive-summary)
2. [Why Literature Integration Matters](#-why-literature-integration-matters)
3. [API Selection: Europe PMC vs NCBI Entrez](#-api-selection-europe-pmc-vs-ncbi-entrez)
4. [Europe PMC API Deep Dive](#-europe-pmc-api-deep-dive)
5. [Data Models and TypeScript Interfaces](#-data-models-and-typescript-interfaces)
6. [Service Implementation](#-service-implementation)
7. [React Components](#-react-components)
8. [Caching Strategy](#-caching-strategy)
9. [Performance Optimization](#-performance-optimization)
10. [Error Handling](#-error-handling)
11. [Accessibility (a11y)](#-accessibility-a11y)
12. [Testing Strategy](#-testing-strategy)
13. [Rate Limiting and Quotas](#-rate-limiting-and-quotas)
14. [Future Enhancements](#-future-enhancements)
15. [Troubleshooting](#-troubleshooting)
16. [API Reference](#-api-reference)

---

## 📋 Executive Summary

### What We're Building

A **literature panel** that displays relevant scientific publications when users explore biomedical entities in PrimeKG. This provides:

- **Evidence-based answers**: Every drug-disease relationship can be backed by citations
- **Credibility**: Users can verify claims against peer-reviewed literature
- **Research depth**: Access to abstracts, authors, journals, and citation metrics

### Key Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| First citation display | < 800ms | User perception of speed |
| Citations per query | 5-10 | Balance between depth and overwhelm |
| Cache hit rate | > 90% | Reduce API calls for common entities |
| Error recovery | 100% | Never break the main UI |

### Technology Stack

- **API**: Europe PMC REST API (preferred over NCBI for CORS/JSON)
- **HTTP Client**: Native `fetch` with timeout handling
- **Caching**: React Query (TanStack Query)
- **UI**: shadcn/ui components (Card, Skeleton, Badge)
- **State**: React Context for cross-component sharing

---

## 🎯 Why Literature Integration Matters

### The Problem

PrimeKG Explorer currently answers questions like:
> "What drugs could treat Alzheimer's disease?"

But users often ask the follow-up:
> "What's the evidence for this?"

Without literature integration, we cannot provide:
1. **Citations** for relationships in the graph
2. **Recent research** that may not be in the static graph
3. **Context** around why certain connections exist

### The Solution

By integrating PubMed/Europe PMC, we enable:

```
User: "Show me drugs for Parkinson's"
PrimeKG: [Returns drug candidates with scores]
Literature Panel: [Shows 5 recent papers on each drug-disease pair]
```

### Business Value

| Stakeholder | Benefit |
|-------------|---------|
| **Researchers** | Verify PrimeKG findings against literature |
| **Clinicians** | Access evidence for treatment decisions |
| **Students** | Learn from primary sources |
| **PrimeKG Platform** | Increased credibility and engagement |

---

## 🔄 API Selection: Europe PMC vs NCBI Entrez

### Comparison Matrix

| Feature | Europe PMC | NCBI Entrez/PubMed |
|---------|------------|-------------------|
| **CORS Support** | ✅ Full | ⚠️ Requires proxy |
| **Response Format** | JSON (native) | XML (primary), JSON (limited) |
| **Rate Limits** | Generous | Strict (3 req/sec without key) |
| **API Key Required** | ❌ No | ✅ Recommended |
| **Full Text Access** | ✅ Open Access | ⚠️ Limited |
| **Citation Counts** | ✅ Included | ❌ Separate API |
| **Latency** | ~300-600ms | ~400-800ms |
| **Documentation** | Excellent | Good but complex |

### Decision: Europe PMC ✅

**Rationale:**
1. **No CORS issues** - Works directly from browser
2. **JSON-first** - No XML parsing overhead
3. **No API key** - Simpler deployment
4. **Includes citation counts** - Useful for ranking
5. **Covers PubMed + PMC** - Unified access

### When to Use NCBI Entrez Instead

- Need MeSH term queries
- Require PubMed-specific features (e.g., filters)
- Building a backend service (no CORS concern)

---

## 🔍 Europe PMC API Deep Dive

### Base URL

```
https://www.ebi.ac.uk/europepmc/webservices/rest
```

### Primary Endpoint: Search

```
GET /search
```

#### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `query` | string | ✅ | Search query (Lucene syntax) | `TP53 AND cancer` |
| `resultType` | string | ❌ | Level of detail | `lite`, `core`, `idlist` |
| `pageSize` | integer | ❌ | Results per page (max 1000) | `10` |
| `cursorMark` | string | ❌ | Pagination cursor | `*` (first page) |
| `format` | string | ❌ | Response format | `json`, `xml` |
| `sort` | string | ❌ | Sort order | `CITED desc`, `DATE desc` |
| `synonym` | boolean | ❌ | Include synonyms | `true` |

#### Example Request

```bash
curl "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=TP53%20AND%20cancer&resultType=core&pageSize=5&format=json&sort=CITED%20desc"
```

#### Response Structure (Core)

```json
{
  "version": "6.7",
  "hitCount": 45678,
  "nextCursorMark": "AoJ...",
  "resultList": {
    "result": [
      {
        "id": "12345678",
        "source": "MED",
        "pmid": "12345678",
        "pmcid": "PMC1234567",
        "doi": "10.1000/example",
        "title": "TP53 mutations in human cancers: origins, consequences, and clinical use",
        "authorString": "Olivier M, Hollstein M, Hainaut P",
        "journalTitle": "Cold Spring Harb Perspect Biol",
        "pubYear": "2010",
        "journalIssn": "1943-0264",
        "pageInfo": "a001008",
        "pubType": "review",
        "isOpenAccess": "Y",
        "inEPMC": "Y",
        "inPMC": "Y",
        "hasPDF": "Y",
        "hasFullText": "Y",
        "citedByCount": 1234,
        "firstPublicationDate": "2010-01-01",
        "abstractText": "The TP53 tumor suppressor gene is the most frequently mutated gene (>50%) in human cancer...",
        "affiliation": "International Agency for Research on Cancer, Lyon, France.",
        "language": "eng",
        "meshHeadingList": {
          "meshHeading": [
            {"descriptorName": "Tumor Suppressor Protein p53"},
            {"descriptorName": "Neoplasms"}
          ]
        },
        "keywordList": {
          "keyword": ["TP53", "cancer", "mutations", "tumor suppressor"]
        },
        "fullTextUrlList": {
          "fullTextUrl": [
            {
              "availability": "Open access",
              "documentStyle": "pdf",
              "site": "Europe_PMC",
              "url": "https://europepmc.org/articles/PMC1234567?pdf=render"
            }
          ]
        }
      }
    ]
  }
}
```

### Query Syntax (Lucene-based)

#### Basic Queries

| Query Type | Syntax | Example |
|------------|--------|---------|
| Single term | `term` | `aspirin` |
| Phrase | `"phrase"` | `"breast cancer"` |
| AND | `term1 AND term2` | `aspirin AND stroke` |
| OR | `term1 OR term2` | `aspirin OR ibuprofen` |
| NOT | `term1 NOT term2` | `cancer NOT review` |
| Wildcard | `term*` | `carcino*` |

#### Field-Specific Queries

| Field | Syntax | Example |
|-------|--------|---------|
| Title | `TITLE:term` | `TITLE:BRCA1` |
| Abstract | `ABSTRACT:term` | `ABSTRACT:mutation` |
| Author | `AUTH:name` | `AUTH:"Smith J"` |
| Journal | `JOURNAL:name` | `JOURNAL:"Nature"` |
| Year | `PUB_YEAR:year` | `PUB_YEAR:2024` |
| Year Range | `PUB_YEAR:[start TO end]` | `PUB_YEAR:[2020 TO 2024]` |
| MeSH | `MESH_HEADING:term` | `MESH_HEADING:"Breast Neoplasms"` |
| Open Access | `OPEN_ACCESS:y` | `OPEN_ACCESS:y` |
| Has PDF | `HAS_PDF:y` | `HAS_PDF:y` |

#### Complex Query Examples

```
# Recent papers on TP53 and cancer, sorted by citations
(TP53 OR "tumor protein p53") AND cancer AND PUB_YEAR:[2020 TO 2024]

# Drug-disease mechanism papers
(Metformin AND "Alzheimer's disease") AND (TITLE:mechanism OR ABSTRACT:mechanism)

# Open access reviews on CRISPR
CRISPR AND OPEN_ACCESS:y AND (PUB_TYPE:review OR PUB_TYPE:"systematic review")
```

### Secondary Endpoint: Citations

```
GET /citations/{source}/{id}
```

Get papers that cite a specific article.

#### Example

```bash
curl "https://www.ebi.ac.uk/europepmc/webservices/rest/MED/12345678/citations?format=json&pageSize=5"
```

### Secondary Endpoint: References

```
GET /references/{source}/{id}
```

Get papers referenced by a specific article.

---

## 📦 Data Models and TypeScript Interfaces

### Core Interfaces

```typescript
// types/pubmed.ts

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
  results: Citation[];
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
```

### Utility Types

```typescript
// types/pubmed.ts (continued)

/**
 * Loading state for async operations
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Error with context
 */
export interface PubMedError {
  code: 'NETWORK' | 'TIMEOUT' | 'RATE_LIMIT' | 'INVALID_QUERY' | 'UNKNOWN';
  message: string;
  retryAfter?: number;
}

/**
 * Query builder for common patterns
 */
export interface QueryBuilder {
  entity: (name: string, type?: 'gene' | 'drug' | 'disease') => string;
  relationship: (entity1: string, entity2: string) => string;
  mechanism: (drug: string, disease: string) => string;
  recentYears: (years: number) => string;
}
```

---

## ⚙️ Service Implementation

### Main Service File

```typescript
// services/pubmedService.ts

import type { 
  Citation, 
  SearchResponse, 
  SearchParams, 
  DisplayCitation,
  PubMedError 
} from '../types/pubmed';

const BASE_URL = 'https://www.ebi.ac.uk/europepmc/webservices/rest';
const DEFAULT_PAGE_SIZE = 10;
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * Transform raw API response to display format
 */
function transformCitation(raw: any): DisplayCitation {
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
    pmcUrl: raw.pmcid ? `https://europepmc.org/article/PMC/${raw.pmcid}` : undefined,
    doiUrl: raw.doi ? `https://doi.org/${raw.doi}` : undefined,
    tags: [
      raw.pubType,
      raw.isOpenAccess === 'Y' ? 'Open Access' : null,
      raw.citedByCount > 100 ? 'Highly Cited' : null,
    ].filter(Boolean) as string[],
  };
}

/**
 * Build query string with entity context
 */
function buildQuery(params: SearchParams): string {
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

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

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
        throw { code: 'TIMEOUT', message: 'Request timed out after 10 seconds' } as PubMedError;
      }
      throw { code: 'NETWORK', message: error.message } as PubMedError;
    }
    throw { code: 'UNKNOWN', message: 'An unexpected error occurred' } as PubMedError;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Search for papers about a specific entity
 */
export async function searchEntityCitations(
  entityName: string,
  entityType: 'gene' | 'drug' | 'disease' | 'pathway' = 'gene',
  limit: number = 5
): Promise<DisplayCitation[]> {
  // Build type-specific query
  let query: string;
  
  switch (entityType) {
    case 'gene':
      query = `(${entityName} OR "${entityName}") AND (gene OR protein OR expression)`;
      break;
    case 'drug':
      query = `"${entityName}" AND (drug OR therapeutic OR treatment OR pharmacology)`;
      break;
    case 'disease':
      query = `"${entityName}" AND (disease OR disorder OR syndrome OR pathology)`;
      break;
    case 'pathway':
      query = `"${entityName}" AND (pathway OR signaling OR cascade)`;
      break;
    default:
      query = entityName;
  }

  const response = await searchCitations({
    query,
    pageSize: limit,
    sort: 'CITED desc',
    yearFrom: new Date().getFullYear() - 5, // Last 5 years
  });

  return response.results;
}

/**
 * Search for papers about a relationship between two entities
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
 */
export async function prefetchCitations(
  entities: Array<{ name: string; type: 'gene' | 'drug' | 'disease' }>
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
```

### React Query Hook

```typescript
// hooks/usePubMed.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  searchEntityCitations, 
  searchRelationshipCitations,
  searchMechanismCitations 
} from '../services/pubmedService';
import type { DisplayCitation } from '../types/pubmed';

const STALE_TIME = 1000 * 60 * 30; // 30 minutes
const CACHE_TIME = 1000 * 60 * 60; // 1 hour

/**
 * Hook to fetch citations for a single entity
 */
export function useEntityCitations(
  entityName: string | null,
  entityType: 'gene' | 'drug' | 'disease' = 'gene',
  limit: number = 5
) {
  return useQuery<DisplayCitation[], Error>({
    queryKey: ['citations', 'entity', entityName, entityType, limit],
    queryFn: () => searchEntityCitations(entityName!, entityType, limit),
    enabled: !!entityName,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * Hook to fetch citations for a relationship
 */
export function useRelationshipCitations(
  entity1: string | null,
  entity2: string | null,
  limit: number = 5
) {
  return useQuery<DisplayCitation[], Error>({
    queryKey: ['citations', 'relationship', entity1, entity2, limit],
    queryFn: () => searchRelationshipCitations(entity1!, entity2!, limit),
    enabled: !!entity1 && !!entity2,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 2,
  });
}

/**
 * Hook to fetch mechanism papers
 */
export function useMechanismCitations(
  drug: string | null,
  disease: string | null,
  limit: number = 5
) {
  return useQuery<DisplayCitation[], Error>({
    queryKey: ['citations', 'mechanism', drug, disease, limit],
    queryFn: () => searchMechanismCitations(drug!, disease!, limit),
    enabled: !!drug && !!disease,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 2,
  });
}

/**
 * Hook to prefetch citations (for hover previews)
 */
export function usePrefetchCitation() {
  const queryClient = useQueryClient();

  return (entityName: string, entityType: 'gene' | 'drug' | 'disease' = 'gene') => {
    queryClient.prefetchQuery({
      queryKey: ['citations', 'entity', entityName, entityType, 3],
      queryFn: () => searchEntityCitations(entityName, entityType, 3),
      staleTime: STALE_TIME,
    });
  };
}
```

---

## 🎨 React Components

### LiteraturePanel (Main Component)

```tsx
// components/entity/LiteraturePanel.tsx

import React, { useState } from 'react';
import { useEntityCitations } from '../../hooks/usePubMed';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '../ui/accordion';
import type { DisplayCitation } from '../../types/pubmed';

interface LiteraturePanelProps {
  entityName: string;
  entityType?: 'gene' | 'drug' | 'disease';
  maxResults?: number;
}

export function LiteraturePanel({ 
  entityName, 
  entityType = 'gene',
  maxResults = 5 
}: LiteraturePanelProps) {
  const { data, isLoading, error, refetch } = useEntityCitations(
    entityName, 
    entityType, 
    maxResults
  );

  if (isLoading) {
    return <LiteratureSkeleton count={3} />;
  }

  if (error) {
    return (
      <ErrorCard 
        message="Failed to load literature" 
        onRetry={() => refetch()} 
      />
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState entityName={entityName} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Scientific Literature
        </h3>
        <Badge variant="secondary">
          {data.length} papers
        </Badge>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {data.map((citation, index) => (
          <CitationCard key={citation.id} citation={citation} index={index} />
        ))}
      </Accordion>

      <SearchMoreLink entityName={entityName} />
    </div>
  );
}

/**
 * Individual citation card with expandable abstract
 */
function CitationCard({ citation, index }: { citation: DisplayCitation; index: number }) {
  return (
    <AccordionItem value={citation.id} className="border rounded-lg">
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex-1 text-left">
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground text-sm font-mono">
              {index + 1}.
            </span>
            <div className="flex-1">
              <p className="font-medium text-sm leading-tight line-clamp-2">
                {citation.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {citation.authors} • {citation.journal} • {citation.year}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            {citation.isOpenAccess && (
              <Badge variant="outline" className="text-xs">
                Open Access
              </Badge>
            )}
            {citation.citedByCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {citation.citedByCount} citations
              </Badge>
            )}
          </div>
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="px-4 pb-4">
        {citation.abstract ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {citation.abstract}
            </p>
            <div className="flex gap-2">
              {citation.pdfUrl && (
                <a 
                  href={citation.pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                  PDF
                </a>
              )}
              {citation.pmcUrl && (
                <a 
                  href={citation.pmcUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">article</span>
                  Full Text
                </a>
              )}
              {citation.doiUrl && (
                <a 
                  href={citation.doiUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">link</span>
                  DOI
                </a>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No abstract available
          </p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

/**
 * Loading skeleton for citations
 */
function LiteratureSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no papers found
 */
function EmptyState({ entityName }: { entityName: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-8 text-center">
        <span className="material-symbols-outlined text-4xl text-muted-foreground">
          library_books
        </span>
        <p className="mt-2 text-sm text-muted-foreground">
          No papers found for "{entityName}"
        </p>
        <a 
          href={`https://europepmc.org/search?query=${encodeURIComponent(entityName)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline mt-2 inline-block"
        >
          Search on Europe PMC →
        </a>
      </CardContent>
    </Card>
  );
}

/**
 * Error card with retry button
 */
function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="py-6 text-center">
        <span className="material-symbols-outlined text-3xl text-destructive">
          error
        </span>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <button 
          onClick={onRetry}
          className="mt-3 text-xs text-primary hover:underline"
        >
          Try again
        </button>
      </CardContent>
    </Card>
  );
}

/**
 * Link to search more on Europe PMC
 */
function SearchMoreLink({ entityName }: { entityName: string }) {
  return (
    <div className="text-center pt-2">
      <a 
        href={`https://europepmc.org/search?query=${encodeURIComponent(entityName)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        View more on Europe PMC →
      </a>
    </div>
  );
}

export default LiteraturePanel;
```

### Citation Tooltip (Hover Preview)

```tsx
// components/entity/CitationTooltip.tsx

import React from 'react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '../ui/tooltip';
import { Badge } from '../ui/badge';
import { useEntityCitations, usePrefetchCitation } from '../../hooks/usePubMed';

interface CitationTooltipProps {
  entityName: string;
  entityType?: 'gene' | 'drug' | 'disease';
  children: React.ReactNode;
}

export function CitationTooltip({ 
  entityName, 
  entityType = 'gene',
  children 
}: CitationTooltipProps) {
  const prefetch = usePrefetchCitation();
  const { data, isLoading } = useEntityCitations(entityName, entityType, 2);

  const handleMouseEnter = () => {
    prefetch(entityName, entityType);
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={500}>
        <TooltipTrigger onMouseEnter={handleMouseEnter} asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-3">
          <div className="space-y-2">
            <p className="text-xs font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">science</span>
              Related Literature
            </p>
            
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Loading...</p>
            ) : data && data.length > 0 ? (
              <ul className="space-y-1">
                {data.slice(0, 2).map((citation) => (
                  <li key={citation.id} className="text-xs">
                    <span className="line-clamp-1">{citation.title}</span>
                    <span className="text-muted-foreground">
                      {' '}({citation.year})
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No papers found</p>
            )}

            {data && data.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{data.length - 2} more
              </Badge>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

---

## 💾 Caching Strategy

### React Query Configuration

```typescript
// lib/queryClient.ts

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // PubMed data is relatively stable
      staleTime: 1000 * 60 * 30, // 30 minutes
      gcTime: 1000 * 60 * 60,    // 1 hour garbage collection
      
      // Retry configuration
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      
      // Refetch behavior
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      
      // Error handling
      throwOnError: false,
    },
  },
});
```

### Cache Key Strategy

```typescript
// Query key patterns
const queryKeys = {
  citations: {
    all: ['citations'] as const,
    entity: (name: string, type: string, limit: number) => 
      ['citations', 'entity', name, type, limit] as const,
    relationship: (e1: string, e2: string, limit: number) => 
      ['citations', 'relationship', e1, e2, limit] as const,
    mechanism: (drug: string, disease: string, limit: number) => 
      ['citations', 'mechanism', drug, disease, limit] as const,
  },
};
```

### Local Storage Persistence (Optional)

```typescript
// For offline capability
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'primekg-citations-cache',
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
  buster: 'v1', // Cache version
});
```

---

## ⚡ Performance Optimization

### 1. Debounced Prefetching

```typescript
import { useDebouncedCallback } from 'use-debounce';

function EntityList({ entities }: { entities: Entity[] }) {
  const prefetch = usePrefetchCitation();

  const debouncedPrefetch = useDebouncedCallback(
    (name: string, type: string) => prefetch(name, type as any),
    300
  );

  return (
    <ul>
      {entities.map((entity) => (
        <li 
          key={entity.id}
          onMouseEnter={() => debouncedPrefetch(entity.name, entity.type)}
        >
          {entity.name}
        </li>
      ))}
    </ul>
  );
}
```

### 2. Intersection Observer for Lazy Loading

```typescript
import { useInView } from 'react-intersection-observer';

function LazyLiteraturePanel({ entityName, entityType }: Props) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div ref={ref}>
      {inView ? (
        <LiteraturePanel entityName={entityName} entityType={entityType} />
      ) : (
        <LiteratureSkeleton count={3} />
      )}
    </div>
  );
}
```

### 3. Request Deduplication

React Query automatically deduplicates concurrent requests for the same key. No additional code needed.

### 4. Staggered Loading Animation

```css
/* Fade-in stagger for citation cards */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.citation-card {
  animation: fadeInUp 0.3s ease-out forwards;
  opacity: 0;
}

.citation-card:nth-child(1) { animation-delay: 0ms; }
.citation-card:nth-child(2) { animation-delay: 50ms; }
.citation-card:nth-child(3) { animation-delay: 100ms; }
.citation-card:nth-child(4) { animation-delay: 150ms; }
.citation-card:nth-child(5) { animation-delay: 200ms; }
```

---

## 🚨 Error Handling

### Error Classification

```typescript
type ErrorCode = 'NETWORK' | 'TIMEOUT' | 'RATE_LIMIT' | 'INVALID_QUERY' | 'UNKNOWN';

interface ErrorConfig {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  userAction: string;
}

const errorConfigs: Record<ErrorCode, ErrorConfig> = {
  NETWORK: {
    code: 'NETWORK',
    message: 'Unable to connect to literature database',
    retryable: true,
    userAction: 'Check your internet connection and try again',
  },
  TIMEOUT: {
    code: 'TIMEOUT',
    message: 'Request took too long to complete',
    retryable: true,
    userAction: 'The server may be busy. Please try again in a moment',
  },
  RATE_LIMIT: {
    code: 'RATE_LIMIT',
    message: 'Too many requests',
    retryable: true,
    userAction: 'Please wait a few seconds before trying again',
  },
  INVALID_QUERY: {
    code: 'INVALID_QUERY',
    message: 'Invalid search query',
    retryable: false,
    userAction: 'Try a different search term',
  },
  UNKNOWN: {
    code: 'UNKNOWN',
    message: 'An unexpected error occurred',
    retryable: true,
    userAction: 'Please try again or contact support',
  },
};
```

### Error Boundary Component

```tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class LiteratureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Literature Panel Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center text-muted-foreground">
          <p>Unable to load literature</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="text-sm text-primary mt-2"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## ♿ Accessibility (a11y)

### Keyboard Navigation

```tsx
// Citation list with keyboard support
function CitationList({ citations }: { citations: DisplayCitation[] }) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, citations.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        const citation = citations[focusedIndex];
        if (citation.pmcUrl) window.open(citation.pmcUrl, '_blank');
        break;
    }
  };

  return (
    <ul role="listbox" onKeyDown={handleKeyDown} tabIndex={0}>
      {citations.map((citation, index) => (
        <li
          key={citation.id}
          role="option"
          aria-selected={index === focusedIndex}
          className={index === focusedIndex ? 'bg-accent' : ''}
        >
          ...
        </li>
      ))}
    </ul>
  );
}
```

### Screen Reader Announcements

```tsx
// Announce loading/results to screen readers
function LiteratureStatus({ isLoading, count }: { isLoading: boolean; count?: number }) {
  return (
    <div 
      role="status" 
      aria-live="polite" 
      className="sr-only"
    >
      {isLoading 
        ? 'Loading scientific literature...' 
        : `Found ${count} papers`
      }
    </div>
  );
}
```

### ARIA Labels

```tsx
<article 
  aria-labelledby={`title-${citation.id}`}
  aria-describedby={`abstract-${citation.id}`}
>
  <h4 id={`title-${citation.id}`}>{citation.title}</h4>
  <p id={`abstract-${citation.id}`}>{citation.abstract}</p>
</article>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// __tests__/pubmedService.test.ts
import { searchCitations, transformCitation } from '../services/pubmedService';

describe('pubmedService', () => {
  describe('transformCitation', () => {
    it('should transform raw API response correctly', () => {
      const raw = {
        id: '12345',
        title: 'Test Paper',
        authorString: 'Smith J, Doe J',
        journalTitle: 'Nature',
        pubYear: '2024',
        isOpenAccess: 'Y',
        citedByCount: 100,
      };

      const result = transformCitation(raw);

      expect(result.title).toBe('Test Paper');
      expect(result.authors).toBe('Smith J, Doe J');
      expect(result.isOpenAccess).toBe(true);
      expect(result.citedByCount).toBe(100);
    });

    it('should handle missing fields gracefully', () => {
      const raw = { id: '12345' };
      const result = transformCitation(raw);

      expect(result.title).toBe('Untitled');
      expect(result.authors).toBe('Unknown authors');
      expect(result.citedByCount).toBe(0);
    });
  });

  describe('searchCitations', () => {
    it('should build query with year filter', async () => {
      // Mock fetch...
      const spy = jest.spyOn(global, 'fetch');
      
      await searchCitations({
        query: 'TP53',
        yearFrom: 2020,
        yearTo: 2024,
      });

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('PUB_YEAR%3A%5B2020%20TO%202024%5D'),
        expect.any(Object)
      );
    });
  });
});
```

### Integration Tests

```typescript
// __tests__/LiteraturePanel.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LiteraturePanel } from '../components/entity/LiteraturePanel';

describe('LiteraturePanel Integration', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  it('should display citations for TP53', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LiteraturePanel entityName="TP53" entityType="gene" />
      </QueryClientProvider>
    );

    // Should show skeleton initially
    expect(screen.getAllByTestId('skeleton')).toHaveLength(3);

    // Should show results after loading
    await waitFor(() => {
      expect(screen.getByText(/Scientific Literature/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should show empty state for unknown entity', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LiteraturePanel entityName="xyznonexistent123" entityType="gene" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/No papers found/i)).toBeInTheDocument();
    });
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/literature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Literature Panel', () => {
  test('should load and display citations', async ({ page }) => {
    await page.goto('/chat');
    
    // Type a query that mentions a gene
    await page.fill('[data-testid="chat-input"]', 'Tell me about TP53');
    await page.click('[data-testid="send-button"]');
    
    // Wait for response and entity panel
    await page.waitForSelector('[data-testid="literature-panel"]');
    
    // Verify citations are displayed
    const citations = await page.locator('.citation-card').count();
    expect(citations).toBeGreaterThan(0);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Block Europe PMC requests
    await page.route('**/europepmc.org/**', (route) => route.abort());
    
    await page.goto('/chat');
    await page.fill('[data-testid="chat-input"]', 'Tell me about BRCA1');
    await page.click('[data-testid="send-button"]');
    
    // Should show error state, not crash
    await page.waitForSelector('[data-testid="literature-error"]');
    expect(await page.locator('[data-testid="retry-button"]').isVisible()).toBe(true);
  });
});
```

---

## 🚦 Rate Limiting and Quotas

### Europe PMC Limits

| Limit Type | Value | Notes |
|------------|-------|-------|
| Requests/second | 3 (recommended) | No hard limit, but be considerate |
| Results/page | 1000 (max) | Use pagination for more |
| Daily requests | Unlimited | Fair use policy applies |
| IP blocking | Possible | If abusing the API |

### Client-Side Rate Limiting

```typescript
// utils/rateLimiter.ts

class RateLimiter {
  private queue: Array<() => void> = [];
  private processing = false;
  private lastRequest = 0;
  private minInterval = 350; // ~3 req/sec

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this.process();
    });
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const elapsed = now - this.lastRequest;
      
      if (elapsed < this.minInterval) {
        await new Promise((r) => setTimeout(r, this.minInterval - elapsed));
      }

      const next = this.queue.shift();
      if (next) {
        this.lastRequest = Date.now();
        next();
      }
    }

    this.processing = false;
  }
}

export const pubmedRateLimiter = new RateLimiter();

// Usage in service
export async function searchCitationsWithLimit(params: SearchParams) {
  await pubmedRateLimiter.acquire();
  return searchCitations(params);
}
```

---

## 🔮 Future Enhancements

### Phase 2: Advanced Features

1. **Citation Graph Visualization**
   - D3.js network of citing papers
   - Identify key papers in a field

2. **Automated Literature Review**
   - LLM summarization of top papers
   - "Explain these papers in context of PrimeKG"

3. **Paper Alerts**
   - Save searches for notifications
   - New papers matching user's entities

4. **Full Text Analysis**
   - Extract methods, results, conclusions
   - NER on abstracts for entity linking

5. **Citation Metrics Dashboard**
   - Track citation trends over time
   - Author co-authorship networks

### Phase 3: Backend Integration

1. **Caching Proxy**
   - Server-side cache for common queries
   - Reduce client-side latency

2. **Pre-seeded Citations**
   - Link entities to papers at import time
   - Instant availability without API call

3. **Citation Recommendations**
   - ML model for relevance ranking
   - User feedback loop

---

## 🔧 Troubleshooting

### Common Issues

#### "No papers found" for common entities

**Cause**: Query may be too specific or malformed.

**Solution**:
```typescript
// Use OR for gene synonyms
const query = `(${geneName} OR "${geneName}") AND (gene OR protein)`;
```

#### Slow load times

**Cause**: Large result sets or network latency.

**Solution**:
1. Reduce `pageSize` to 5
2. Enable skeleton loading
3. Use `staleTime` for instant cache hits

#### CORS errors

**Cause**: Shouldn't happen with Europe PMC, but if using NCBI...

**Solution**:
1. Switch to Europe PMC (recommended)
2. Set up backend proxy if NCBI is required

#### Rate limit errors

**Cause**: Too many rapid requests.

**Solution**:
1. Implement client-side rate limiter
2. Increase debounce on prefetch
3. Cache more aggressively

---

## 📖 API Reference

### searchCitations

```typescript
function searchCitations(params: SearchParams): Promise<SearchResponse>
```

**Parameters:**
- `query` (string): Lucene-syntax search query
- `pageSize` (number, optional): Results per page (default: 10)
- `cursorMark` (string, optional): Pagination cursor
- `sort` ('CITED desc' | 'DATE desc' | 'RELEVANCE', optional): Sort order
- `openAccessOnly` (boolean, optional): Filter to open access
- `yearFrom` (number, optional): Start year filter
- `yearTo` (number, optional): End year filter

**Returns:**
- `hitCount` (number): Total matching papers
- `nextCursorMark` (string): Next page cursor
- `results` (DisplayCitation[]): Transformed citations

### searchEntityCitations

```typescript
function searchEntityCitations(
  entityName: string,
  entityType: 'gene' | 'drug' | 'disease' | 'pathway',
  limit: number
): Promise<DisplayCitation[]>
```

Convenience wrapper for entity-specific searches with appropriate query templates.

### searchRelationshipCitations

```typescript
function searchRelationshipCitations(
  entity1: string,
  entity2: string,
  limit: number
): Promise<DisplayCitation[]>
```

Find papers discussing the relationship between two entities.

### searchMechanismCitations

```typescript
function searchMechanismCitations(
  drug: string,
  disease: string,
  limit: number
): Promise<DisplayCitation[]>
```

Find papers explaining drug-disease mechanisms.

---

## 📝 Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-22 | Initial documentation |

---

## 📚 References

- [Europe PMC API Documentation](https://europepmc.org/RestfulWebService)
- [Europe PMC Search Syntax](https://europepmc.org/searchsyntax)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [shadcn/ui Components](https://ui.shadcn.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

*Document maintained by the PrimeKG Development Team*
*Last updated: January 22, 2026*
