import React, { useState } from 'react';

/**
 * Visual cards for hypothesis generation results.
 * Makes drug repurposing, targets, and combinations more engaging.
 */

interface RepurposingCandidate {
    drug: string;
    original_indication?: string;
    shared_target?: string;
    confidence?: string;
    score?: number;
}

interface TherapeuticTarget {
    target: string;
    target_type?: string;
    relation_to_disease?: string;
    existing_drugs?: number;
    score?: number;
}

interface DrugCombination {
    partner_drug: string;
    shared_pathway?: string;
    mechanism?: string;
    score?: number;
}

interface HypothesisCardsProps {
    data: RepurposingCandidate[] | TherapeuticTarget[] | DrugCombination[];
    type: 'repurposing' | 'targets' | 'combinations';
    darkMode?: boolean;
    onExploreNode?: (nodeName: string) => void;
}

const HypothesisCards: React.FC<HypothesisCardsProps> = ({
    data,
    type,
    darkMode = false,
    onExploreNode
}) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    if (!data || data.length === 0) return null;

    const getTypeConfig = () => {
        switch (type) {
            case 'repurposing':
                return {
                    icon: '💊',
                    title: 'Drug Repurposing Candidates',
                    color: darkMode ? 'from-purple-500 to-pink-500' : 'from-purple-600 to-pink-600',
                    borderColor: darkMode ? 'border-purple-500/30' : 'border-purple-200',
                    bgColor: darkMode ? 'bg-purple-500/10' : 'bg-purple-50'
                };
            case 'targets':
                return {
                    icon: '🎯',
                    title: 'Therapeutic Targets',
                    color: darkMode ? 'from-red-500 to-orange-500' : 'from-red-600 to-orange-600',
                    borderColor: darkMode ? 'border-red-500/30' : 'border-red-200',
                    bgColor: darkMode ? 'bg-red-500/10' : 'bg-red-50'
                };
            case 'combinations':
                return {
                    icon: '⚗️',
                    title: 'Drug Combinations',
                    color: darkMode ? 'from-indigo-500 to-violet-500' : 'from-indigo-600 to-violet-600',
                    borderColor: darkMode ? 'border-indigo-500/30' : 'border-indigo-200',
                    bgColor: darkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'
                };
        }
    };

    const config = getTypeConfig();

    const renderRepurposingCard = (item: RepurposingCandidate, index: number) => {
        const isExpanded = expandedIndex === index;

        return (
            <div
                key={index}
                className={`
          group border rounded-xl p-4 transition-all duration-200
          ${config.borderColor}
          bg-surface/50 hover:bg-surface/70
        `}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <button
                                onClick={() => onExploreNode?.(item.drug)}
                                className={`
                  font-semibold text-base truncate hover:underline
                  ${darkMode ? 'text-purple-400' : 'text-purple-700'}
                `}
                            >
                                {item.drug}
                            </button>
                            {item.confidence && (
                                <span className={`
                  text-xs px-2 py-0.5 rounded-full font-medium
                  ${item.confidence === 'High'
                                        ? darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                        : darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                                    }
                `}>
                                    {item.confidence}
                                </span>
                            )}
                        </div>

                        <div className={`text-sm space-y-1 text-tertiary`}>
                            {item.original_indication && (
                                <div className="flex items-start gap-2">
                                    <span className="text-xs opacity-70 flex-shrink-0">Currently treats:</span>
                                    <span className="font-medium">{item.original_indication}</span>
                                </div>
                            )}
                            {item.shared_target && (
                                <div className="flex items-start gap-2">
                                    <span className="text-xs opacity-70 flex-shrink-0">Shared target:</span>
                                    <button
                                        onClick={() => onExploreNode?.(item.shared_target!)}
                                        className="font-medium hover:underline text-left"
                                    >
                                        {item.shared_target}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => setExpandedIndex(isExpanded ? null : index)}
                        className={`
              flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
              transition-colors
              ${darkMode ? 'hover:bg-purple-500/20' : 'hover:bg-purple-100'}
            `}
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                    </button>
                </div>

                {isExpanded && (
                    <div className={`
            mt-3 pt-3 border-t text-xs space-y-2
            border-border text-tertiary
          `}>
                        <p className="italic">
                            This drug targets the same molecular pathway as the disease, suggesting potential therapeutic benefit.
                        </p>
                        <button
                            onClick={() => onExploreNode?.(item.drug)}
                            className={`
                text-xs font-medium flex items-center gap-1
                ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}
              `}
                        >
                            <span className="material-symbols-outlined text-[14px]">hub</span>
                            Explore network
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderTargetCard = (item: TherapeuticTarget, index: number) => {
        const isExpanded = expandedIndex === index;

        return (
            <div
                key={index}
                className={`
          group border rounded-xl p-4 transition-all duration-200
          ${config.borderColor}
          bg-surface/50 hover:bg-surface/70
        `}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <button
                                onClick={() => onExploreNode?.(item.target)}
                                className={`
                  font-semibold text-base truncate hover:underline
                  ${darkMode ? 'text-red-400' : 'text-red-700'}
                `}
                            >
                                {item.target}
                            </button>
                            {item.target_type && (
                                <span className={`
                  text-xs px-2 py-0.5 rounded-full font-medium
                  bg-surface-hover text-secondary
                `}>
                                    {item.target_type}
                                </span>
                            )}
                        </div>

                        <div className={`text-sm space-y-1 text-tertiary`}>
                            {item.relation_to_disease && (
                                <div className="flex items-start gap-2">
                                    <span className="text-xs opacity-70 flex-shrink-0">Relation:</span>
                                    <span className="font-medium">{item.relation_to_disease}</span>
                                </div>
                            )}
                            {item.existing_drugs !== undefined && (
                                <div className="flex items-start gap-2">
                                    <span className="text-xs opacity-70 flex-shrink-0">Existing drugs:</span>
                                    <span className={`font-bold ${item.existing_drugs > 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {item.existing_drugs}
                                        {item.existing_drugs === 0 && ' (Novel target!)'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => setExpandedIndex(isExpanded ? null : index)}
                        className={`
              flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
              transition-colors
              ${darkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-100'}
            `}
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                    </button>
                </div>

                {isExpanded && (
                    <div className={`
            mt-3 pt-3 border-t text-xs space-y-2
            border-border text-tertiary
          `}>
                        <p className="italic">
                            {item.existing_drugs === 0
                                ? 'This is a novel target with no approved drugs yet - high potential for drug discovery.'
                                : `This validated target already has ${item.existing_drugs} approved drug(s), indicating druggability.`
                            }
                        </p>
                        <button
                            onClick={() => onExploreNode?.(item.target)}
                            className={`
                text-xs font-medium flex items-center gap-1
                ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}
              `}
                        >
                            <span className="material-symbols-outlined text-[14px]">hub</span>
                            Explore network
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderCombinationCard = (item: DrugCombination, index: number) => {
        const isExpanded = expandedIndex === index;

        return (
            <div
                key={index}
                className={`
          group border rounded-xl p-4 transition-all duration-200
          ${config.borderColor}
          bg-surface/50 hover:bg-surface/70
        `}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <button
                            onClick={() => onExploreNode?.(item.partner_drug)}
                            className={`
                font-semibold text-base truncate hover:underline mb-2 block
                ${darkMode ? 'text-indigo-400' : 'text-indigo-700'}
              `}
                        >
                            {item.partner_drug}
                        </button>

                        <div className={`text-sm space-y-1 text-tertiary`}>
                            {item.mechanism && (
                                <div className="flex items-start gap-2">
                                    <span className="text-xs opacity-70 flex-shrink-0">Mechanism:</span>
                                    <span className="font-medium">{item.mechanism}</span>
                                </div>
                            )}
                            {item.shared_pathway && (
                                <div className="flex items-start gap-2">
                                    <span className="text-xs opacity-70 flex-shrink-0">Pathway:</span>
                                    <button
                                        onClick={() => onExploreNode?.(item.shared_pathway!)}
                                        className="font-medium hover:underline text-left"
                                    >
                                        {item.shared_pathway}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => setExpandedIndex(isExpanded ? null : index)}
                        className={`
              flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
              transition-colors
              ${darkMode ? 'hover:bg-indigo-500/20' : 'hover:bg-indigo-100'}
            `}
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                    </button>
                </div>

                {isExpanded && (
                    <div className={`
            mt-3 pt-3 border-t text-xs space-y-2
            border-border text-tertiary
          `}>
                        <p className="italic">
                            Combining drugs with complementary mechanisms may enhance therapeutic efficacy.
                        </p>
                        <button
                            onClick={() => onExploreNode?.(item.partner_drug)}
                            className={`
                text-xs font-medium flex items-center gap-1
                ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}
              `}
                        >
                            <span className="material-symbols-outlined text-[14px]">hub</span>
                            Explore network
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="my-4 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{config.icon}</span>
                <h3 className={`font-semibold text-sm text-primary`}>
                    {config.title}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} text-secondary`}>
                    {data.length} found
                </span>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {data.map((item, index) => {
                    if (type === 'repurposing') {
                        return renderRepurposingCard(item as RepurposingCandidate, index);
                    } else if (type === 'targets') {
                        return renderTargetCard(item as TherapeuticTarget, index);
                    } else {
                        return renderCombinationCard(item as DrugCombination, index);
                    }
                })}
            </div>
        </div>
    );
};

export default HypothesisCards;
