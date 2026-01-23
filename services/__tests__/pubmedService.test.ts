/**
 * Unit tests for PubMed Service
 * @module services/__tests__/pubmedService.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  transformCitation,
  buildQuery,
  searchCitations,
  searchEntityCitations,
  searchRelationshipCitations,
  searchMechanismCitations,
} from '../pubmedService';
import type { SearchParams } from '../../types/pubmed';

// Mock fetch globally
global.fetch = vi.fn();

describe('pubmedService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('transformCitation', () => {
    it('should transform raw API response correctly with complete data', () => {
      const raw = {
        id: '12345678',
        pmid: '12345678',
        pmcid: 'PMC1234567',
        doi: '10.1000/example',
        title: 'TP53 mutations in human cancers',
        authorString: 'Smith J, Doe J, Johnson A',
        journalTitle: 'Nature',
        journalAbbreviation: 'Nat.',
        pubYear: '2024',
        pubType: 'research-article',
        isOpenAccess: 'Y',
        citedByCount: 150,
        abstractText: 'This is a test abstract about TP53 mutations.',
        fullTextUrlList: {
          fullTextUrl: [
            {
              availability: 'Open access',
              documentStyle: 'pdf',
              site: 'Europe_PMC',
              url: 'https://europepmc.org/articles/PMC1234567?pdf=render',
            },
          ],
        },
      };

      const result = transformCitation(raw);

      expect(result.id).toBe('12345678');
      expect(result.pmid).toBe('12345678');
      expect(result.doi).toBe('10.1000/example');
      expect(result.title).toBe('TP53 mutations in human cancers');
      expect(result.authors).toBe('Smith J, Doe J, Johnson A');
      expect(result.journal).toBe('Nature');
      expect(result.year).toBe('2024');
      expect(result.abstract).toBe('This is a test abstract about TP53 mutations.');
      expect(result.citedByCount).toBe(150);
      expect(result.isOpenAccess).toBe(true);
      expect(result.pdfUrl).toBe('https://europepmc.org/articles/PMC1234567?pdf=render');
      expect(result.pmcUrl).toBe('https://europepmc.org/article/PMC/1234567');
      expect(result.doiUrl).toBe('https://doi.org/10.1000/example');
      expect(result.tags).toContain('Open Access');
      expect(result.tags).toContain('Highly Cited');
      expect(result.tags).toContain('research-article');
    });

    it('should handle missing fields gracefully', () => {
      const raw = { 
        id: '12345',
        isOpenAccess: 'N',
      };
      
      const result = transformCitation(raw);

      expect(result.id).toBe('12345');
      expect(result.title).toBe('Untitled');
      expect(result.authors).toBe('Unknown authors');
      expect(result.journal).toBe('Unknown journal');
      expect(result.year).toBe('N/A');
      expect(result.citedByCount).toBe(0);
      expect(result.isOpenAccess).toBe(false);
      expect(result.pdfUrl).toBeUndefined();
      expect(result.pmcUrl).toBeUndefined();
      expect(result.doiUrl).toBeUndefined();
    });

    it('should only include PDF URL if it is open access', () => {
      const rawWithSubscriptionPdf = {
        id: '12345',
        isOpenAccess: 'N',
        fullTextUrlList: {
          fullTextUrl: [
            {
              availability: 'Subscription required',
              documentStyle: 'pdf',
              url: 'https://example.com/pdf',
            },
          ],
        },
      };

      const result = transformCitation(rawWithSubscriptionPdf);
      expect(result.pdfUrl).toBeUndefined();
    });

    it('should handle PMC ID with or without PMC prefix', () => {
      const rawWithPrefix = {
        id: '1',
        pmcid: 'PMC1234567',
        isOpenAccess: 'Y',
      };

      const result = transformCitation(rawWithPrefix);
      expect(result.pmcUrl).toBe('https://europepmc.org/article/PMC/1234567');
    });

    it('should not tag as highly cited if citations < 100', () => {
      const raw = {
        id: '1',
        citedByCount: 50,
        isOpenAccess: 'N',
      };

      const result = transformCitation(raw);
      expect(result.tags).not.toContain('Highly Cited');
    });
  });

  describe('buildQuery', () => {
    it('should return query as-is with no filters', () => {
      const params: SearchParams = {
        query: 'TP53 AND cancer',
      };

      const result = buildQuery(params);
      expect(result).toBe('TP53 AND cancer');
    });

    it('should add year range filter', () => {
      const params: SearchParams = {
        query: 'TP53',
        yearFrom: 2020,
        yearTo: 2024,
      };

      const result = buildQuery(params);
      expect(result).toBe('TP53 AND PUB_YEAR:[2020 TO 2024]');
    });

    it('should use default year range if only yearFrom is provided', () => {
      const params: SearchParams = {
        query: 'TP53',
        yearFrom: 2020,
      };

      const currentYear = new Date().getFullYear();
      const result = buildQuery(params);
      expect(result).toBe(`TP53 AND PUB_YEAR:[2020 TO ${currentYear}]`);
    });

    it('should use default year range if only yearTo is provided', () => {
      const params: SearchParams = {
        query: 'TP53',
        yearTo: 2024,
      };

      const result = buildQuery(params);
      expect(result).toBe('TP53 AND PUB_YEAR:[1900 TO 2024]');
    });

    it('should add open access filter', () => {
      const params: SearchParams = {
        query: 'TP53',
        openAccessOnly: true,
      };

      const result = buildQuery(params);
      expect(result).toBe('TP53 AND OPEN_ACCESS:y');
    });

    it('should combine multiple filters', () => {
      const params: SearchParams = {
        query: 'TP53',
        yearFrom: 2020,
        yearTo: 2024,
        openAccessOnly: true,
      };

      const result = buildQuery(params);
      expect(result).toBe('TP53 AND PUB_YEAR:[2020 TO 2024] AND OPEN_ACCESS:y');
    });
  });

  describe('searchCitations', () => {
    it('should make correct API request with default parameters', async () => {
      const mockResponse = {
        hitCount: 100,
        nextCursorMark: 'next123',
        resultList: {
          result: [
            {
              id: '1',
              title: 'Test Paper',
              authorString: 'Author A',
              journalTitle: 'Journal',
              pubYear: '2024',
              isOpenAccess: 'Y',
              citedByCount: 10,
            },
          ],
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await searchCitations({
        query: 'TP53',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('query=TP53'),
        expect.objectContaining({
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        })
      );

      expect(result.hitCount).toBe(100);
      expect(result.nextCursorMark).toBe('next123');
      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe('Test Paper');
    });

    it('should handle empty results', async () => {
      const mockResponse = {
        hitCount: 0,
        resultList: {
          result: [],
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await searchCitations({
        query: 'nonexistent123xyz',
      });

      expect(result.hitCount).toBe(0);
      expect(result.results).toHaveLength(0);
    });

    it('should throw NETWORK error on fetch failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        searchCitations({ query: 'TP53' })
      ).rejects.toMatchObject({
        code: 'NETWORK',
        message: 'Network error',
      });
    });

    it('should throw TIMEOUT error on abort', async () => {
      (global.fetch as any).mockRejectedValueOnce(
        Object.assign(new Error('Aborted'), { name: 'AbortError' })
      );

      await expect(
        searchCitations({ query: 'TP53' })
      ).rejects.toMatchObject({
        code: 'TIMEOUT',
        message: 'Request timed out after 10 seconds',
      });
    });

    it('should throw error on non-OK HTTP response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        searchCitations({ query: 'TP53' })
      ).rejects.toMatchObject({
        code: 'NETWORK',
        message: 'HTTP 500: Internal Server Error',
      });
    });

    it('should use custom sort parameter', async () => {
      const mockResponse = {
        hitCount: 10,
        resultList: { result: [] },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await searchCitations({
        query: 'TP53',
        sort: 'DATE desc',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sort=DATE+desc'),
        expect.any(Object)
      );
    });

    it('should use custom page size', async () => {
      const mockResponse = {
        hitCount: 10,
        resultList: { result: [] },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await searchCitations({
        query: 'TP53',
        pageSize: 20,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('pageSize=20'),
        expect.any(Object)
      );
    });
  });

  describe('searchEntityCitations', () => {
    beforeEach(() => {
      const mockResponse = {
        hitCount: 5,
        resultList: {
          result: [
            {
              id: '1',
              title: 'Gene Study',
              authorString: 'Author A',
              journalTitle: 'Journal',
              pubYear: '2024',
              isOpenAccess: 'Y',
              citedByCount: 10,
            },
          ],
        },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });
    });

    it('should build gene-specific query', async () => {
      await searchEntityCitations('TP53', 'gene', 5);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('gene+OR+protein+OR+expression'),
        expect.any(Object)
      );
    });

    it('should build drug-specific query', async () => {
      await searchEntityCitations('Metformin', 'drug', 5);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('drug+OR+therapeutic+OR+treatment'),
        expect.any(Object)
      );
    });

    it('should build disease-specific query', async () => {
      await searchEntityCitations('Alzheimer', 'disease', 5);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('disease+OR+disorder+OR+syndrome'),
        expect.any(Object)
      );
    });

    it('should build pathway-specific query', async () => {
      await searchEntityCitations('MAPK', 'pathway', 5);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('pathway+OR+signaling+OR+cascade'),
        expect.any(Object)
      );
    });

    it('should filter to last 5 years', async () => {
      const currentYear = new Date().getFullYear();
      await searchEntityCitations('TP53', 'gene', 5);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`PUB_YEAR%3A%5B${currentYear - 5}+TO+${currentYear}%5D`),
        expect.any(Object)
      );
    });

    it('should sort by citations descending', async () => {
      await searchEntityCitations('TP53', 'gene', 5);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sort=CITED+desc'),
        expect.any(Object)
      );
    });
  });

  describe('searchRelationshipCitations', () => {
    it('should build relationship query with both entities', async () => {
      const mockResponse = {
        hitCount: 3,
        resultList: { result: [] },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await searchRelationshipCitations('TP53', 'Cancer', 5);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('TP53'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('Cancer'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('mechanism+OR+interaction+OR+effect'),
        expect.any(Object)
      );
    });
  });

  describe('searchMechanismCitations', () => {
    it('should build mechanism query with drug and disease', async () => {
      const mockResponse = {
        hitCount: 2,
        resultList: { result: [] },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await searchMechanismCitations('Metformin', 'Diabetes', 5);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('Metformin'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('Diabetes'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('mechanism'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sort=RELEVANCE'),
        expect.any(Object)
      );
    });
  });
});
