import React from 'react';
import { TherapeuticTargetsResponse } from '../../types';

interface Props {
    data?: TherapeuticTargetsResponse;
    isLoading: boolean;
}

const TherapeuticTargetsCard: React.FC<Props> = ({ data, isLoading }) => {
    if (isLoading) {
        return <div className="bg-surface border border-border rounded-2xl p-6 h-80 animate-pulse bg-gradient-to-br from-surface to-surface-hover" />;
    }

    const targets = data?.targets || [];

    return (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-lg transition-all hover:border-emerald-500/30">
            <div className="p-4 border-b border-border bg-emerald-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500">target</span>
                    <h3 className="font-bold text-primary">Therapeutic Targets</h3>
                </div>
                <span className="text-[10px] font-mono text-tertiary px-2 py-0.5 rounded-full bg-border/50">
                    {targets.length} targets
                </span>
            </div>
            
            <div className="p-4 h-64 overflow-y-auto custom-scrollbar space-y-3">
                {targets.length > 0 ? (
                    targets.map((t, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-hover/50 border border-border/50 group hover:border-emerald-500/30 transition-all">
                            <div className="flex-1">
                                <div className="font-bold text-sm text-primary group-hover:text-emerald-500 transition-colors">
                                    {t.gene}
                                </div>
                                <div className="text-[10px] text-tertiary flex items-center gap-2">
                                    <span>Evidence Score:</span>
                                    <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500" 
                                            style={{ width: `${Math.min(100, (t.score || 0.3) * 100)}%` }} 
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <div className="text-xs font-mono font-bold text-emerald-400">
                                    {((t.score || 0.3) * 10).toFixed(1)}/10
                                </div>
                                {t.evidence_count && (
                                    <div className="text-[8px] text-muted-foreground uppercase">{t.evidence_count} Citations</div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                        <span className="material-symbols-outlined text-4xl mb-2">dna</span>
                        <p className="text-xs">No targets identified</p>
                    </div>
                )}
            </div>
            
            <div className="p-3 bg-surface-hover/30 border-t border-border flex justify-end">
                <button 
                    disabled={!data}
                    className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 hover:text-indigo-400 disabled:opacity-30 flex items-center gap-1"
                >
                    Target Profile <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};

export default TherapeuticTargetsCard;
