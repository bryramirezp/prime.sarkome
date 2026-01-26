import React from 'react';
import { PhenotypeMatchingResponse } from '../../types';

interface Props {
    data?: PhenotypeMatchingResponse;
    isLoading: boolean;
    onVisualize?: (drug: string) => void;
}

const PhenotypeMatchCard: React.FC<Props> = ({ data, isLoading, onVisualize }) => {
    return (
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm h-[320px] flex flex-col relative overflow-hidden group hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                     <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-500">
                        <span className="material-symbols-outlined text-[20px]">biotech</span>
                    </div>
                    <h3 className="font-bold text-primary">Phenotype Matching</h3>
                </div>
                 {data && (
                    <div className="text-[10px] bg-surface-hover px-2 py-1 rounded-full text-tertiary font-mono">
                        {data.length} matches
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-3 opacity-50">
                        <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                        <div className="text-xs text-orange-400 font-mono">Comparing phenotypes...</div>
                    </div>
                ) : data && data.length > 0 ? (
                    <div className="space-y-2">
                        {data.map((item, i) => (
                            <div key={i} className="bg-surface-hover/30 hover:bg-surface-hover border border-transparent hover:border-orange-500/20 rounded-lg p-3 transition-all group/item">
                                <div className="flex flex-col gap-2">
                                     <div className="flex items-center justify-between">
                                        <div className="font-bold text-sm text-primary">{item.drug}</div>
                                         {onVisualize && (
                                            <button 
                                                onClick={() => onVisualize(item.drug)}
                                                className="opacity-0 group-hover/item:opacity-100 p-1 text-orange-500 hover:bg-orange-500/10 rounded transition-all"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">hub</span>
                                            </button>
                                        )}
                                     </div>
                                     
                                     <div className="flex flex-wrap gap-1.5">
                                        {item.shared_phenotypes?.slice(0, 3).map((p, j) => (
                                            <span key={j} className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/5 text-orange-400 border border-orange-500/10">
                                                {p}
                                            </span>
                                        ))}
                                        {item.shared_phenotypes && item.shared_phenotypes.length > 3 && (
                                            <span className="text-[9px] px-1.5 py-0.5 text-tertiary">
                                                +{item.shared_phenotypes.length - 3}
                                            </span>
                                        )}
                                     </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-tertiary opacity-60">
                         <span className="material-symbols-outlined text-4xl mb-2 opacity-30">manage_search</span>
                         <span className="text-xs">No phenotypic matches</span>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-border flex justify-end">
                <button className="text-[10px] font-bold uppercase tracking-wider text-orange-500 hover:text-orange-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Compare Symptoms
                    <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};

export default PhenotypeMatchCard;
