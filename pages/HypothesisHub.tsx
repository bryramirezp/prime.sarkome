import React, { useState } from 'react';
import { kgService } from '../services/kgService';
import { 
    DrugRepurposingResponse, 
    TherapeuticTargetsResponse, 
    PhenotypeMatchingResponse, 
    EnvironmentalRiskResponse
} from '../types';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// New Components
import DrugRepurposingCard from '../components/hypothesis/DrugRepurposingCard';
import TherapeuticTargetsCard from '../components/hypothesis/TherapeuticTargetsCard';
import PhenotypeMatchCard from '../components/hypothesis/PhenotypeMatchCard';
import EnvironmentalRiskCard from '../components/hypothesis/EnvironmentalRiskCard';

const HypothesisHub: React.FC = () => {
    const navigate = useNavigate();
    const [disease, setDisease] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<{
        repurposing?: DrugRepurposingResponse;
        targets?: TherapeuticTargetsResponse;
        phenotypes?: PhenotypeMatchingResponse;
        risks?: EnvironmentalRiskResponse;
    } | null>(null);

    const handleAnalyze = async () => {
        if (!disease.trim()) {
            toast.error("Please enter a disease name.");
            return;
        }

        setIsLoading(true);
        setResults(null);
        const originalTerm = disease.trim();
        let targetTerm = originalTerm;
        let groundedTerm: string | null = null;

        try {
            // STEP 1: Attempt Semantic Grounding first
            try {
                console.log(`[Hypothesis] Starting semantic search for: "${originalTerm}"`);
                const searchResults = await kgService.searchSemantic(originalTerm);
                
                if (searchResults && searchResults.length > 0) {
                     const bestMatch = searchResults[0];
                     console.log(`[Hypothesis] Top match:`, bestMatch);
                     
                     if(bestMatch.name && bestMatch.name.toLowerCase() !== originalTerm.toLowerCase()) {
                        console.log(`[Hypothesis] Grounding term: "${originalTerm}" -> "${bestMatch.name}"`);
                        groundedTerm = bestMatch.name;
                        targetTerm = bestMatch.name;
                        toast.success(`Resolved to: ${bestMatch.name}`, { icon: '🎯', duration: 3000 });
                     }
                }
            } catch (searchErr) {
                console.warn("[Hypothesis] Semantic grounding failed, using raw term.", searchErr);
            }

            // Helper function to extract general disease category
            const extractGeneralTerm = (term: string): string | null => {
                // Remove specific variants/subtypes
                const patterns = [
                    /, .+$/,  // Remove everything after comma (e.g., "sarcoma, inflammatory variant" -> "sarcoma")
                    / \(.+\)$/,  // Remove parenthetical info
                    /^undifferentiated /i,  // Remove "undifferentiated"
                    /^pleomorphic /i,  // Remove "pleomorphic"
                    /^malignant /i,  // Remove "malignant"
                ];
                
                let general = term;
                for (const pattern of patterns) {
                    general = general.replace(pattern, '').trim();
                }
                
                // If we extracted something shorter and meaningful, return it
                if (general.length > 3 && general.length < term.length) {
                    return general;
                }
                
                return null;
            };

            // STEP 2: First attempt with grounded/original term
            console.log(`[Hypothesis] Querying APIs with term: "${targetTerm}"`);
            let [repurposing, targets, phenotypes, risks] = await Promise.all([
                kgService.getDrugRepurposing(targetTerm).catch((err) => {
                    console.warn(`[Hypothesis] Repurposing failed for "${targetTerm}":`, err);
                    return undefined;
                }),
                kgService.getTherapeuticTargets(targetTerm).catch((err) => {
                    console.warn(`[Hypothesis] Targets failed for "${targetTerm}":`, err);
                    return undefined;
                }),
                kgService.getPhenotypeMatching(targetTerm).catch((err) => {
                    console.warn(`[Hypothesis] Phenotypes failed for "${targetTerm}":`, err);
                    return undefined;
                }),
                kgService.getEnvironmentalRisks(targetTerm).catch((err) => {
                    console.warn(`[Hypothesis] Risks failed for "${targetTerm}":`, err);
                    return undefined;
                })
            ]);

            // Helper to check if we have any actual data
            const hasData = (r: any, t: any, p: any, e: any) => 
                (r && Array.isArray(r) && r.length > 0) || 
                (t && Array.isArray(t) && t.length > 0) || 
                (p && Array.isArray(p) && p.length > 0) || 
                (e && Array.isArray(e) && e.length > 0);

            // STEP 3: If no results, try with original term (if different from grounded)
            if (groundedTerm && !hasData(repurposing, targets, phenotypes, risks)) {
                console.log(`[Hypothesis] No results with grounded term. Retrying with original: "${originalTerm}"`);
                toast.loading(`Trying original term...`, { duration: 1500 });
                
                [repurposing, targets, phenotypes, risks] = await Promise.all([
                    kgService.getDrugRepurposing(originalTerm).catch(() => undefined),
                    kgService.getTherapeuticTargets(originalTerm).catch(() => undefined),
                    kgService.getPhenotypeMatching(originalTerm).catch(() => undefined),
                    kgService.getEnvironmentalRisks(originalTerm).catch(() => undefined)
                ]);
                
                if (hasData(repurposing, targets, phenotypes, risks)) {
                    targetTerm = originalTerm;
                }
            }

            // STEP 4: If still no results, try with general disease category
            if (!hasData(repurposing, targets, phenotypes, risks)) {
                const generalTerm = extractGeneralTerm(targetTerm);
                
                if (generalTerm && generalTerm !== targetTerm) {
                    console.log(`[Hypothesis] No results found. Trying general category: "${generalTerm}"`);
                    toast.loading(`Trying general category: ${generalTerm}...`, { duration: 2000 });
                    
                    [repurposing, targets, phenotypes, risks] = await Promise.all([
                        kgService.getDrugRepurposing(generalTerm).catch(() => undefined),
                        kgService.getTherapeuticTargets(generalTerm).catch(() => undefined),
                        kgService.getPhenotypeMatching(generalTerm).catch(() => undefined),
                        kgService.getEnvironmentalRisks(generalTerm).catch(() => undefined)
                    ]);
                    
                    if (hasData(repurposing, targets, phenotypes, risks)) {
                        targetTerm = generalTerm;
                        toast.success(`Found results for general category: ${generalTerm}`, { icon: '🔍', duration: 4000 });
                    }
                }
            }

            // Log results for debugging
            console.log('[Hypothesis] Results:', {
                repurposing: repurposing ? `${Array.isArray(repurposing) ? repurposing.length : 'object'} items` : 'none',
                targets: targets ? `${Array.isArray(targets) ? targets.length : 'object'} items` : 'none',
                phenotypes: phenotypes ? `${Array.isArray(phenotypes) ? phenotypes.length : 'object'} items` : 'none',
                risks: risks ? `${Array.isArray(risks) ? risks.length : 'object'} items` : 'none'
            });

            setResults({
                repurposing: repurposing as any, 
                targets: targets as any, 
                phenotypes: phenotypes as any, 
                risks: risks as any
            });

            if(!hasData(repurposing, targets, phenotypes, risks)) {
                 console.warn(`[Hypothesis] No results found for any endpoint with term: "${targetTerm}"`);
                 toast.error(
                     `No biomedical signals found. The backend may not have pre-computed data for "${originalTerm}". Try a more common disease.`, 
                     { duration: 6000 }
                 );
            } else {
                 toast.success(`Analysis complete for ${targetTerm}`);
                 // Update input to reflect what was actually analyzed
                 setDisease(targetTerm);
            }

        } catch (err) {
            console.error("[Hypothesis] Analysis Hub error:", err);
            toast.error("Failed to aggregate hypothesis data. Check console for details.");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to jump to graph with an entity pre-selected
    const handleVisualize = (entityName: string) => {
        // We can pass state or query param. For now, let's use a specialized route or just navigate
        // Ideally GraphExplorer reads a query param ?entity=...
        // For now, let's just push to graph and rely on user manual search or context hook
        // Since GraphExplorer doesn't parse query params yet, we'll notify user
        toast.success(`Visualizing ${entityName}...`);
        // In a real app, this would use context or URL params to drive GraphExplorer
         navigate('/graph'); 
    };

    return (
        <div className="flex-1 overflow-y-auto bg-background p-6 space-y-8 custom-scrollbar h-full">
            {/* Header */}
            <div className="max-w-6xl mx-auto pt-4">
                <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-indigo-500 text-3xl">biotech</span>
                    <h1 className="text-3xl font-bold text-foreground">Hypothesis Hub</h1>
                </div>
                <p className="text-muted-foreground max-w-2xl">
                    Run comprehensive biomedical simulations across the PrimeKG knowledge graph to discover 
                    drug candidates, genetic targets, and environmental risk factors.
                </p>
            </div>

            {/* Input Section */}
            <div className="max-w-6xl mx-auto">
                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-2 w-full">
                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            Target Disease / Condition
                        </label>
                        <input 
                            type="text"
                            value={disease}
                            onChange={(e) => setDisease(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                            placeholder="e.g. Sarcoma"
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                        />
                    </div>
                    <button 
                        onClick={handleAnalyze}
                        disabled={isLoading || !disease.trim()}
                        className="h-[50px] px-8 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <span className="material-symbols-outlined">analytics</span>
                        )}
                        {isLoading ? 'Processing...' : 'Analyze Signals'}
                    </button>
                </div>
            </div>

            {/* Results Grid - Only show if we have results or are loading */}
            {(results || isLoading) && (
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <DrugRepurposingCard 
                        data={results?.repurposing} 
                        isLoading={isLoading} 
                        onVisualize={handleVisualize}
                    />
                    <TherapeuticTargetsCard 
                        data={results?.targets} 
                        isLoading={isLoading} 
                        onVisualize={handleVisualize}
                    />
                    <PhenotypeMatchCard 
                        data={results?.phenotypes} 
                        isLoading={isLoading} 
                        onVisualize={handleVisualize}
                    />
                    <EnvironmentalRiskCard 
                        data={results?.risks} 
                        isLoading={isLoading} 
                    />
                </div>
            )}
            
            {/* Empty State / Prompt */}
            {!results && !isLoading && (
                 <div className="max-w-6xl mx-auto mt-12 text-center opacity-40">
                    <div className="inline-block p-6 rounded-full bg-surface-hover mb-4">
                        <span className="material-symbols-outlined text-4xl">travel_explore</span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Awaiting Input</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                        Enter a disease name above to trigger a multi-endpoint analysis across PrimeKG's 8.1M+ relationships.
                    </p>
                </div>
            )}
        </div>
    );
};

export default HypothesisHub;
