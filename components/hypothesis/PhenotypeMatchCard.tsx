import React from 'react';
import { PhenotypeMatchingResponse } from '../../types';

interface Props {
    data?: PhenotypeMatchingResponse;
    isLoading: boolean;
}

const PhenotypeMatchCard: React.FC<Props> = ({ data, isLoading }) => {
    if (isLoading) {
        return <div className="bg-surface border border-border rounded-2xl p-6 h-80 animate-pulse bg-gradient-to-br from-surface to-surface-hover" />;
    }

    const candidates = data?.candidates || [];

    return (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-lg transition-all hover:border-orange-500/30">
            <div className="p-4 border-b border-border bg-orange-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-500">symptoms</span>
                    <h3 className="font-bold text-primary">Phenotype Matching</h3>
                </div>
                <span className="text-[10px] font-mono text-tertiary px-2 py-0.5 rounded-full bg-border/50">
                    {candidates.length} matches
                </span>
            </div>
            
            <div className="p-4 h-64 overflow-y-auto custom-scrollbar space-y-3">
                {candidates.length > 0 ? (
                    candidates.map((c, i) => (
                        <div key={i} className="p-3 rounded-xl bg-surface-hover/50 border border-border/50 group hover:border-orange-500/30 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-bold text-sm text-primary group-hover:text-orange-500 transition-colors">{c.drug}</div>
                                <div className="text-xs font-mono font-bold text-orange-400">
                                    {Math.round(c.overlap_score * 100)}% Match
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-1">
                                {c.shared_phenotypes.slice(0, 3).map((p, j) => (
                                    <span key={j} className="text-[8px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                        {p}
                                    </span>
                                ))}
                                {c.shared_phenotypes.length > 3 && (
                                    <span className="text-[8px] text-tertiary">+{c.shared_phenotypes.length - 3} more</span>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                        <span className="material-symbols-outlined text-4xl mb-2">clinical_notes</span>
                        <p className="text-xs">No phenotypic matches</p>
                    </div>
                )}
            </div>
            
            <div className="p-3 bg-surface-hover/30 border-t border-border flex justify-end">
                <button 
                    disabled={!data}
                    className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 hover:text-indigo-400 disabled:opacity-30 flex items-center gap-1"
                >
                    Compare Symptoms <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};

export default PhenotypeMatchCard;
