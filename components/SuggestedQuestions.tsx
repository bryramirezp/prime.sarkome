import { generateSuggestedQuestions } from '../services/questionGenerator';
import { useState, useEffect } from 'react';

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
        query: 'Show me the network of genes and proteins that interact with TP53. What drugs target this pathway.',
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

const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
    onSelectQuestion,
    darkMode = false,
    maxQuestions = 4
}) => {
    const [displayQuestions, setDisplayQuestions] = useState<SuggestedQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const loadQuestions = async () => {
            // Start with static rotated questions as instant fallback
            const hour = new Date().getHours();
            const startIndex = hour % SUGGESTED_QUESTIONS.length;
            const rotatedStatic = [
                ...SUGGESTED_QUESTIONS.slice(startIndex),
                ...SUGGESTED_QUESTIONS.slice(0, startIndex)
            ].slice(0, maxQuestions);
            
            if (mounted) setDisplayQuestions(rotatedStatic);

            // Fetch dynamic questions
            try {
                const dynamic = await generateSuggestedQuestions(maxQuestions);
                if (mounted && dynamic && dynamic.length > 0) {
                    setDisplayQuestions(dynamic);
                }
            } catch (err) {
                console.warn("Using static questions due to generation error");
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        loadQuestions();

        return () => { mounted = false; };
    }, [maxQuestions]);

    const questions = displayQuestions;

    const getCategoryColor = (category: SuggestedQuestion['category']) => {
        switch (category) {
            case 'repurposing':
                return 'border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/5';
            case 'mechanism':
                return 'border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/5';
            case 'visualization':
                return 'border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5';
            case 'discovery':
            default:
                return 'border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/5';
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <p className={`text-xs font-medium mb-3 text-center text-tertiary`}>
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
              bg-surface/50 shadow-sm
            `}
                    >
                        <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                            {q.emoji}
                        </span>
                        <span className={`text-sm font-medium leading-snug text-primary`}>
                            {q.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SuggestedQuestions;
