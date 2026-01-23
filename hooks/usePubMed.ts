/**
 * Custom React Query hooks for PubMed/Europe PMC integration
 * @module hooks/usePubMed
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  searchEntityCitations, 
  searchRelationshipCitations,
  searchMechanismCitations 
} from '../services/pubmedService';
import type { DisplayCitation, EntityType } from '../types/pubmed';

const STALE_TIME = 1000 * 60 * 30; // 30 minutes
const CACHE_TIME = 1000 * 60 * 60; // 1 hour

/**
 * Hook to fetch citations for a single entity
 * @param entityName - Name of the entity to search for
 * @param entityType - Type of entity (gene, drug, disease, pathway)
 * @param limit - Maximum number of results to return
 * @returns React Query result with citations data
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useEntityCitations('TP53', 'gene', 5);
 * ```
 */
export function useEntityCitations(
  entityName: string | null,
  entityType: EntityType = 'gene',
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
 * Hook to fetch citations for a relationship between two entities
 * @param entity1 - First entity name
 * @param entity2 - Second entity name
 * @param limit - Maximum number of results to return
 * @returns React Query result with citations data
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useRelationshipCitations('TP53', 'Cancer', 5);
 * ```
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
 * Hook to fetch mechanism papers for drug-disease pairs
 * @param drug - Drug name
 * @param disease - Disease name
 * @param limit - Maximum number of results to return
 * @returns React Query result with citations data
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useMechanismCitations('Metformin', 'Diabetes', 5);
 * ```
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
 * Hook to prefetch citations (for hover previews and optimistic loading)
 * @returns Function to prefetch citations for an entity
 * 
 * @example
 * ```tsx
 * const prefetch = usePrefetchCitation();
 * 
 * <div onMouseEnter={() => prefetch('TP53', 'gene')}>
 *   Hover to prefetch
 * </div>
 * ```
 */
export function usePrefetchCitation() {
  const queryClient = useQueryClient();

  return (entityName: string, entityType: EntityType = 'gene', limit: number = 3) => {
    queryClient.prefetchQuery({
      queryKey: ['citations', 'entity', entityName, entityType, limit],
      queryFn: () => searchEntityCitations(entityName, entityType, limit),
      staleTime: STALE_TIME,
    });
  };
}

/**
 * Hook to invalidate citation cache (useful after updates)
 * @returns Function to invalidate all citation queries
 * 
 * @example
 * ```tsx
 * const invalidate = useInvalidateCitations();
 * 
 * <button onClick={invalidate}>Refresh Citations</button>
 * ```
 */
export function useInvalidateCitations() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['citations'] });
  };
}
