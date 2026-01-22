import React from 'react';

// Pricing Constants (January 2026)
const PRICING = {
    'gemini-3.0-flash': { input: 0.50, output: 3.00 },
    'gemini-3.0-pro': { input: 2.00, output: 12.00 },
    'gemini-2.0-flash-exp': { input: 0.00, output: 0.00 }, // Free
    'default': { input: 0.50, output: 3.00 } // Fallback to Flash pricing
};

interface CostTrackerProps {
    currentUsage?: {
        promptTokens: number;
        completionTokens: number;
        model: string;
    };
    sessionTotal: {
        queries: number;
        totalCost: number;
    };
}

export function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const normModel = model.toLowerCase();
    let price = PRICING['default'];

    if (normModel.includes('flash') && normModel.includes('3.0')) {
        price = PRICING['gemini-3.0-flash'];
    } else if (normModel.includes('pro') && normModel.includes('3.0')) {
        price = PRICING['gemini-3.0-pro'];
    } else if (normModel.includes('2.0')) {
        price = PRICING['gemini-2.0-flash-exp'];
    }

    const inputCost = (promptTokens / 1_000_000) * price.input;
    const outputCost = (completionTokens / 1_000_000) * price.output;
    return inputCost + outputCost;
}

export const CostTracker: React.FC<CostTrackerProps> = ({ currentUsage, sessionTotal }) => {
    if (!currentUsage && sessionTotal.queries === 0) return null;

    const currentCost = currentUsage
        ? calculateCost(currentUsage.model, currentUsage.promptTokens, currentUsage.completionTokens)
        : 0;

    const formatCost = (cost: number) => {
        if (cost === 0) return '$0.000 (FREE)';
        return `$${cost.toFixed(4)}`;
    };

    const formatTokens = (num: number) => {
        if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
        return num.toString();
    };

    return (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 rounded-lg p-3 text-xs shadow-sm w-full max-w-[280px] font-mono">
            {currentUsage && (
                <div className="mb-3 pb-3 border-b border-slate-100 dark:border-zinc-800/50">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                        This Query
                    </div>
                    <div className="grid grid-cols-2 gap-y-1 gap-x-4">
                        <div className="text-slate-500 dark:text-slate-500">Tokens In:</div>
                        <div className="text-right text-slate-700 dark:text-slate-300">{formatTokens(currentUsage.promptTokens)}</div>

                        <div className="text-slate-500 dark:text-slate-500">Tokens Out:</div>
                        <div className="text-right text-slate-700 dark:text-slate-300">{formatTokens(currentUsage.completionTokens)}</div>

                        <div className="text-slate-500 dark:text-slate-500">Model:</div>
                        <div className="text-right text-slate-700 dark:text-slate-300 truncate" title={currentUsage.model}>
                            {currentUsage.model.replace('gemini-', '').replace('-preview', '')}
                        </div>

                        <div className="text-emerald-600 dark:text-emerald-500 font-bold mt-1">Cost:</div>
                        <div className="text-right text-emerald-600 dark:text-emerald-500 font-bold mt-1">
                            {formatCost(currentCost)}
                        </div>
                    </div>
                </div>
            )}

            <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">bar_chart</span>
                    Session Total
                </div>
                <div className="flex justify-between items-center">
                    <div className="text-slate-600 dark:text-slate-400">
                        {sessionTotal.queries} queries
                    </div>
                    <div className="text-slate-800 dark:text-slate-200 font-bold text-sm">
                        ${sessionTotal.totalCost.toFixed(4)}
                    </div>
                </div>
            </div>
        </div>
    );
};
