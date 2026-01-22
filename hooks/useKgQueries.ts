import { useQuery } from '@tanstack/react-query';
import { kgService } from '../services/kgService';

export function useHealth() {
    return useQuery({
        queryKey: ['health'],
        queryFn: ({ signal }) => kgService.getHealth(signal),
        refetchInterval: 60000, // Check health every minute
    });
}

export function useStats() {
    return useQuery({
        queryKey: ['stats'],
        queryFn: ({ signal }) => kgService.getStats(signal),
    });
}

export function useSemanticSearch(query: string) {
    return useQuery({
        queryKey: ['search', 'semantic', query],
        queryFn: ({ signal }) => kgService.searchSemantic(query, signal),
        enabled: !!query && query.length > 2,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

export function useNeighbors(nodeId: string) {
    return useQuery({
        queryKey: ['neighbors', nodeId],
        queryFn: ({ signal }) => kgService.getNeighbors(nodeId, signal),
        enabled: !!nodeId,
    });
}

export function useDrugRepurposing(disease: string) {
    return useQuery({
        queryKey: ['hypothesis', 'repurposing', disease],
        queryFn: ({ signal }) => kgService.getDrugRepurposing(disease, signal),
        enabled: !!disease,
    });
}

export function useTherapeuticTargets(disease: string) {
    return useQuery({
        queryKey: ['hypothesis', 'targets', disease],
        queryFn: ({ signal }) => kgService.getTherapeuticTargets(disease, signal),
        enabled: !!disease,
    });
}

export function useDrugCombinations(drug: string) {
    return useQuery({
        queryKey: ['hypothesis', 'combinations', drug],
        queryFn: ({ signal }) => kgService.getDrugCombinations(drug, signal),
        enabled: !!drug,
    });
}

export function useMechanism(drug: string, disease: string) {
    return useQuery({
        queryKey: ['hypothesis', 'mechanism', drug, disease],
        queryFn: ({ signal }) => kgService.getDrugMechanism(drug, disease, signal),
        enabled: !!drug && !!disease,
    });
}

export function useSubgraph(entity: string, hops: number = 1, limit: number = 50) {
    return useQuery({
        queryKey: ['subgraph', entity, hops, limit],
        queryFn: ({ signal }) => kgService.getSubgraph(entity, hops, limit, signal),
        enabled: !!entity,
    });
}


