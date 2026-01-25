import React, { useState } from 'react';
import { kgService } from '../services/kgService';
import { 
    DrugRepurposingResponse, 
    TherapeuticTargetsResponse, 
    PhenotypeMatchingResponse, 
    EnvironmentalRiskResponse,
    DrugCombinationsResponse
} from '../types';
import { toast } from 'react-hot-toast';

// Component Imports (To be created next)
import DrugRepurposingCard from '../components/hypothesis/DrugRepurposingCard';
import TherapeuticTargetsCard from '../components/hypothesis/TherapeuticTargetsCard';
import PhenotypeMatchCard from '../components/hypothesis/PhenotypeMatchCard';
import EnvironmentalRiskCard from '../components/hypothesis/EnvironmentalRiskCard';

const HypothesisHub: React.FC = () => {
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

        try {
            // Run all analyses in parallel for maximum efficiency
            const [repurposing, targets, phenotypes, risks] = await Promise.all([
                kgService.getDrugRepurposing(disease).catch(() => null),
                kgService.getTherapeuticTargets(disease).catch(() => null),
                kgService.getPhenotypeMatching(disease).catch(() => null),
                kgService.getEnvironmentalRisks(disease).catch(() => null)
            ]);

            setResults({
                repurposing: repurposing || undefined,
                targets: targets || undefined,
                phenotypes: phenotypes || undefined,
                risks: risks || undefined
            });

            toast.success(`Analysis complete for ${disease}`);
        } catch (err) {
            console.error("Analysis Hub error:", err);
            toast.error("Failed to aggregate hypothesis data.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[rgb(var(--color-bg-main))] p-6 space-y-8 custom-scrollbar">
            {/* Header */}
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-indigo-500 text-3xl">biotech</span>
                    <h1 className="text-3xl font-bold text-primary">Hypothesis Hub</h1>
                </div>
                <p className="text-secondary max-w-2xl">
                    Run comprehensive biomedical simulations across the PrimeKG knowledge graph to discover 
                    drug candidates, genetic targets, and environmental risk factors.
                </p>
            </div>

            {/* Input Section */}
            <div className="max-w-6xl mx-auto">
                <div className="bg-surface border border-border p-6 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-2 w-full">
                        <label className="block text-xs font-bold uppercase tracking-widest text-tertiary">
                            Target Disease / Condition
                        </label>
                        <input 
                            type="text"
                            value={disease}
                            onChange={(e) => setDisease(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                            placeholder="e.g. Alzheimer Disease, Leukemia, Sarcoma..."
                            className="w-full bg-[rgb(var(--color-input-bg))] border border-[rgb(var(--color-input-border))] rounded-xl px-4 py-3 text-primary outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
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

            {/* Results Grid */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                <DrugRepurposingCard data={results?.repurposing} isLoading={isLoading} />
                <TherapeuticTargetsCard data={results?.targets} isLoading={isLoading} />
                <PhenotypeMatchCard data={results?.phenotypes} isLoading={isLoading} />
                <EnvironmentalRiskCard data={results?.risks} isLoading={isLoading} />
            </div>

            {results && !results.repurposing && !results.targets && !results.phenotypes && !results.risks && !isLoading && (
                <div className="max-w-6xl mx-auto p-12 text-center opacity-50">
                    <span className="material-symbols-outlined text-6xl mb-4">search_off</span>
                    <h3 className="text-xl font-bold">No Signals Detected</h3>
                    <p className="text-sm">Try a more specific official disease name (e.g., from UMLS or MeSH).</p>
                </div>
            )}
        </div>
    );
};

export default HypothesisHub;
