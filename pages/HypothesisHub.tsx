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
        let targetTerm = disease.trim();

        try {
            // STEP 1: Attempt Semantic Grounding first
            // This prevents 404s by resolving "breast cancer" -> "Malignant neoplasm of breast"
            try {
                const searchResults = await kgService.searchSemantic(targetTerm);
                if (searchResults && searchResults.length > 0) {
                     // Prefer the top match if it's a disease or close match
                     const bestMatch = searchResults[0];
                     if(bestMatch.name && bestMatch.name.toLowerCase() !== targetTerm.toLowerCase()) {
                        console.log(`[Hypothesis] Grounding term: "${targetTerm}" -> "${bestMatch.name}"`);
                        targetTerm = bestMatch.name;
                        toast.success(`Resolved to: ${bestMatch.name}`, { icon: '🎯' });
                     }
                }
            } catch (searchErr) {
                console.warn("Semantic grounding skipped/failed, using raw term.", searchErr);
            }

            // STEP 2: Run all analyses in parallel using the (potentially grounded) term
            const [repurposing, targets, phenotypes, risks] = await Promise.all([
                kgService.getDrugRepurposing(targetTerm).catch(() => undefined),
                kgService.getTherapeuticTargets(targetTerm).catch(() => undefined),
                kgService.getPhenotypeMatching(targetTerm).catch(() => undefined),
                kgService.getEnvironmentalRisks(targetTerm).catch(() => undefined)
            ]);

            setResults({
                repurposing, 
                targets, 
                phenotypes, 
                risks
            });

            if(!repurposing && !targets && !phenotypes && !risks) {
                 toast('No significant signals found for this entity name.', { icon: '🔍' });
            } else {
                 toast.success(`Analysis complete for ${targetTerm}`);
                 // Update input to reflect what was actually analyzed (optional UX choice, usually good)
                 setDisease(targetTerm);
            }

        } catch (err) {
            console.error("Analysis Hub error:", err);
            toast.error("Failed to aggregate hypothesis data.");
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
