import React from 'react';
import { EnvironmentalRiskResponse } from '../../types';

interface Props {
    data?: EnvironmentalRiskResponse;
    isLoading: boolean;
}

const EnvironmentalRiskCard: React.FC<Props> = ({ data, isLoading }) => {
    return (
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm h-[320px] flex flex-col relative overflow-hidden group hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-7 duration-500">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                     <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
                        <span className="material-symbols-outlined text-[20px]">public</span>
                    </div>
                    <h3 className="font-bold text-primary">Environmental Risks</h3>
                </div>
                 {data && (
                    <div className="text-[10px] bg-surface-hover px-2 py-1 rounded-full text-tertiary font-mono">
                        {data.length} factors
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-3 opacity-50">
                        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        <div className="text-xs text-blue-400 font-mono">Loading exposome data...</div>
                    </div>
                ) : data && data.length > 0 ? (
                    <div className="space-y-2">
                        {data.map((item, i) => (
                            <div key={i} className="bg-surface-hover/30 hover:bg-surface-hover border border-transparent hover:border-blue-500/20 rounded-lg p-3 transition-all">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <div className="font-bold text-sm text-primary">{item.exposure}</div>
                                        <div className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded uppercase font-bold tracking-wider">
                                            {item.exposure_type}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-tertiary leading-relaxed">
                                        {item.relationship}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-tertiary opacity-60">
                         <span className="material-symbols-outlined text-4xl mb-2 opacity-30">eco</span>
                         <span className="text-xs">No environmental data</span>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-border flex justify-end">
                <button className="text-[10px] font-bold uppercase tracking-wider text-blue-500 hover:text-blue-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Exposome Map
                    <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};

export default EnvironmentalRiskCard;
