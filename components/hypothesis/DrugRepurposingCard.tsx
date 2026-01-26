import React from 'react';
import { DrugRepurposingResponse } from '../../types';

interface Props {
    data?: DrugRepurposingResponse;
    isLoading: boolean;
    onVisualize?: (drug: string) => void;
}

const DrugRepurposingCard: React.FC<Props> = ({ data, isLoading, onVisualize }) => {
    return (
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm h-[320px] flex flex-col relative overflow-hidden group hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                     <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-500">
                        <span className="material-symbols-outlined text-[20px]">medication_liquid</span>
                    </div>
                    <h3 className="font-bold text-primary">Drug Repurposing</h3>
                </div>
                {data && (
                    <div className="text-[10px] bg-surface-hover px-2 py-1 rounded-full text-tertiary font-mono">
                        {data.length} candidates
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-3 opacity-50">
                        <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        <div className="text-xs text-indigo-400 font-mono">Scanning FDA database...</div>
                    </div>
                ) : data && data.length > 0 ? (
                    <div className="space-y-2">
                        {data.map((item, i) => (
                            <div key={i} className="bg-surface-hover/30 hover:bg-surface-hover border border-transparent hover:border-indigo-500/20 rounded-lg p-3 transition-all group/item">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="font-bold text-sm text-primary flex items-center gap-2">
                                            {item.drug}
                                            {(item.score || 0) > 0.8 && (
                                                <span className="text-[9px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded font-mono uppercase tracking-wide">High Confidence</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <div className="text-[10px] text-tertiary">
                                                Match Score: <span className="font-mono text-primary font-bold">{(item.score || 0).toFixed(2)}</span>
                                            </div>
                                            {item.original_indication && (
                                                <div className="text-[10px] text-tertiary border-l border-border pl-3">
                                                    Indication: <span className="text-indigo-400">{item.original_indication}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {onVisualize && (
                                        <button 
                                            onClick={() => onVisualize(item.drug)}
                                            className="opacity-0 group-hover/item:opacity-100 p-1.5 hover:bg-indigo-500/20 text-indigo-500 rounded transition-all"
                                            title="Visualize in Graph"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">hub</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-tertiary opacity-60">
                         <span className="material-symbols-outlined text-4xl mb-2 opacity-30">science</span>
                         <span className="text-xs">No candidates found</span>
                    </div>
                )}
            </div>
            
            {/* Footer Action */}
             <div className="mt-4 pt-3 border-t border-border flex justify-end">
                <button className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 hover:text-indigo-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    View Details
                    <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};

export default DrugRepurposingCard;
