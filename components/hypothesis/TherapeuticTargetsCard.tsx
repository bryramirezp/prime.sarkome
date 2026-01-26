import React from 'react';
import { TherapeuticTargetsResponse } from '../../types';

interface Props {
    data?: TherapeuticTargetsResponse;
    isLoading: boolean;
    onVisualize?: (gene: string) => void;
}

const TherapeuticTargetsCard: React.FC<Props> = ({ data, isLoading, onVisualize }) => {
    return (
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm h-[320px] flex flex-col relative overflow-hidden group hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                     <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500">
                        <span className="material-symbols-outlined text-[20px]">target</span>
                    </div>
                    <h3 className="font-bold text-primary">Therapeutic Targets</h3>
                </div>
                 {data && (
                    <div className="text-[10px] bg-surface-hover px-2 py-1 rounded-full text-tertiary font-mono">
                        {data.length} targets
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-3 opacity-50">
                        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                        <div className="text-xs text-emerald-400 font-mono">Identifying gene targets...</div>
                    </div>
                ) : data && data.length > 0 ? (
                    <div className="space-y-2">
                        {data.map((item, i) => (
                            <div key={i} className="bg-surface-hover/30 hover:bg-surface-hover border border-transparent hover:border-emerald-500/20 rounded-lg p-3 transition-all group/item">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="font-bold text-sm text-primary flex items-center gap-2">
                                            {item.gene}
                                        </div>
                                        <div className="text-[10px] text-tertiary mt-1">
                                            Evidence Score: <span className="font-mono text-primary font-bold">{(item.score || 0).toFixed(3)}</span> • {item.evidence_count || 0} sources
                                        </div>
                                    </div>
                                    <div className="w-16 h-1 bg-surface-hover rounded-full overflow-hidden mr-3">
                                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${(item.score || 0) * 100}%` }} />
                                    </div>
                                    {onVisualize && (
                                        <button 
                                            onClick={() => onVisualize(item.gene)}
                                            className="opacity-0 group-hover/item:opacity-100 p-1.5 hover:bg-emerald-500/20 text-emerald-500 rounded transition-all"
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
                         <span className="material-symbols-outlined text-4xl mb-2 opacity-30">dna</span>
                         <span className="text-xs">No targets identified</span>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-border flex justify-end">
                <button className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 hover:text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Target Profile
                    <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};

export default TherapeuticTargetsCard;
