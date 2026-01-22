import React from 'react';

/**
 * Suggested questions for the chat empty state.
 * Each question is designed to showcase different capabilities of PrimeAI.
 */

export interface SuggestedQuestion {
    id: string;
    emoji: string;
    label: string;
    query: string;
    category: 'discovery' | 'mechanism' | 'visualization' | 'repurposing';
}

export const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
    {
        id: 'repurposing-sarcoma',
        emoji: '💊',
        label: 'Drug candidates for sarcoma',
        query: 'What existing drugs could potentially be repurposed to treat sarcoma? Show me the molecular targets they share.',
        category: 'repurposing'
    },
    {
        id: 'mechanism-imatinib',
        emoji: '🔬',
        label: 'How does Imatinib work?',
        query: 'Explain the mechanism of action of Imatinib in treating chronic myeloid leukemia. Show the pathway from drug to disease.',
        category: 'mechanism'
    },
    {
        id: 'targets-lung-cancer',
        emoji: '🎯',
        label: 'Therapeutic targets for lung cancer',
        query: 'What are the most promising therapeutic targets for non-small cell lung cancer? Which ones already have approved drugs?',
        category: 'discovery'
    },
    {
        id: 'tp53-connections',
        emoji: '🧬',
        label: 'Explore TP53 network',
        query: 'Show me the network of genes and proteins that interact with TP53. What drugs target this pathway?',
        category: 'visualization'
    },
    {
        id: 'drug-synergy',
        emoji: '⚗️',
        label: 'Drug combinations with Metformin',
        query: 'What drugs could synergize with Metformin for cancer treatment? Explain the complementary mechanisms.',
        category: 'repurposing'
    },
    {
        id: 'alzheimer-pathways',
        emoji: '🧠',
        label: 'Alzheimer\'s disease pathways',
        query: 'What are the main biological pathways involved in Alzheimer\'s disease? Which genes are associated and what drugs target them?',
        category: 'discovery'
    }
];

interface SuggestedQuestionsProps {
    onSelectQuestion: (query: string) => void;
    darkMode?: boolean;
    maxQuestions?: number;
}

/**
 * Component that displays suggested questions as clickable cards.
 * Clicking a question immediately sends it to the chat.
 */
const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
    onSelectQuestion,
    darkMode = false,
    maxQuestions = 4
}) => {
    // Rotate questions to show different ones, based on current hour
    const getRotatedQuestions = () => {
        const hour = new Date().getHours();
        const startIndex = hour % SUGGESTED_QUESTIONS.length;
        const rotated = [
            ...SUGGESTED_QUESTIONS.slice(startIndex),
            ...SUGGESTED_QUESTIONS.slice(0, startIndex)
        ];
        return rotated.slice(0, maxQuestions);
    };

    const questions = getRotatedQuestions();

    const getCategoryColor = (category: SuggestedQuestion['category']) => {
        switch (category) {
            case 'repurposing':
                return darkMode
                    ? 'border-purple-500/30 hover:border-purple-400/50 hover:bg-purple-500/10'
                    : 'border-purple-200 hover:border-purple-300 hover:bg-purple-50';
            case 'mechanism':
                return darkMode
                    ? 'border-cyan-500/30 hover:border-cyan-400/50 hover:bg-cyan-500/10'
                    : 'border-cyan-200 hover:border-cyan-300 hover:bg-cyan-50';
            case 'visualization':
                return darkMode
                    ? 'border-emerald-500/30 hover:border-emerald-400/50 hover:bg-emerald-500/10'
                    : 'border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50';
            case 'discovery':
            default:
                return darkMode
                    ? 'border-amber-500/30 hover:border-amber-400/50 hover:bg-amber-500/10'
                    : 'border-amber-200 hover:border-amber-300 hover:bg-amber-50';
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <p className={`text-xs font-medium mb-3 text-center ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Try asking...
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {questions.map((q) => (
                    <button
                        key={q.id}
                        onClick={() => onSelectQuestion(q.query)}
                        className={`
              group flex items-start gap-3 p-4 rounded-xl border text-left
              transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
              ${getCategoryColor(q.category)}
              ${darkMode ? 'bg-zinc-900/50' : 'bg-white shadow-sm'}
            `}
                    >
                        <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                            {q.emoji}
                        </span>
                        <span className={`text-sm font-medium leading-snug ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            {q.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SuggestedQuestions;
