import React from 'react';
import { EnvironmentalRiskResponse } from '../../types';

interface Props {
    data?: EnvironmentalRiskResponse;
    isLoading: boolean;
}

const EnvironmentalRiskCard: React.FC<Props> = ({ data, isLoading }) => {
    if (isLoading) {
        return <div className="bg-surface border border-border rounded-2xl p-6 h-80 animate-pulse bg-gradient-to-br from-surface to-surface-hover" />;
    }

    const risks = data?.risks || [];

    return (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-lg transition-all hover:border-indigo-500/30">
            <div className="p-4 border-b border-border bg-indigo-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-500">public</span>
                    <h3 className="font-bold text-primary">Environmental Risks</h3>
                </div>
                <span className="text-[10px] font-mono text-tertiary px-2 py-0.5 rounded-full bg-border/50">
                    {risks.length} factors
                </span>
            </div>
            
            <div className="p-4 h-64 overflow-y-auto custom-scrollbar space-y-3">
                {risks.length > 0 ? (
                    risks.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-hover/50 border border-border/50 group hover:border-indigo-500/30 transition-all">
                            <div className="flex-1">
                                <div className="font-bold text-sm text-primary group-hover:text-indigo-500 transition-colors">{r.exposure}</div>
                                <div className="text-[10px] text-tertiary flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 uppercase font-mono">
                                        {r.exposure_type}
                                    </span>
                                    <span className="opacity-50">/</span>
                                    <span className="truncate">{r.relationship}</span>
                                </div>
                            </div>
                            {r.evidence_score && (
                                <div className="text-right">
                                    <div className="text-xs font-mono font-bold text-indigo-400">
                                        {r.evidence_score.toFixed(1)}
                                    </div>
                                    <div className="text-[8px] text-muted-foreground uppercase">EVID.</div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                        <span className="material-symbols-outlined text-4xl mb-2">eco</span>
                        <p className="text-xs">No environmental data</p>
                    </div>
                )}
            </div>
            
            <div className="p-3 bg-surface-hover/30 border-t border-border flex justify-end">
                <button 
                    disabled={!data}
                    className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 hover:text-indigo-400 disabled:opacity-30 flex items-center gap-1"
                >
                    Exposome Map <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};

export default EnvironmentalRiskCard;
