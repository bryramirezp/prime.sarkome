import React from 'react';

/**
 * Detects and makes entity mentions clickable in AI responses.
 * Allows users to explore nodes directly from the text.
 */

interface EntityMentionProps {
    text: string;
    onExploreNode: (nodeName: string) => void;
    darkMode?: boolean;
}

/**
 * Common biomedical entity patterns to detect:
 * - Drug names (often capitalized, may end with -mab, -nib, -tinib, etc.)
 * - Gene/Protein names (all caps like TP53, EGFR, or PascalCase)
 * - Disease names (capitalized phrases)
 */
const ENTITY_PATTERNS = [
    // Drugs with common suffixes
    /\b([A-Z][a-z]+(?:mab|nib|tinib|olol|pril|statin|cillin|mycin|cycline))\b/g,
    // Gene symbols (2-6 uppercase letters/numbers)
    /\b([A-Z]{2,6}[0-9]{0,2})\b/g,
    // Capitalized medical terms (2+ words)
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g,
    // Single capitalized drug names
    /\b(Aspirin|Imatinib|Metformin|Paclitaxel|Cisplatin|Doxorubicin|Tamoxifen)\b/gi,
];

/**
 * Words to exclude from entity detection (common false positives)
 */
const EXCLUDE_WORDS = new Set([
    'The', 'This', 'That', 'These', 'Those', 'What', 'Which', 'Who', 'When', 'Where', 'Why', 'How',
    'Can', 'Could', 'Should', 'Would', 'May', 'Might', 'Must', 'Will', 'Shall',
    'PrimeKG', 'PrimeAI', 'Google', 'Gemini', 'Neo4j', 'API', 'AI', 'LLM',
    'Step', 'First', 'Second', 'Third', 'Next', 'Finally', 'However', 'Therefore',
    'Example', 'Note', 'Important', 'Summary', 'Conclusion'
]);

/**
 * Extract potential entities from text
 */
const extractEntities = (text: string): Set<string> => {
    const entities = new Set<string>();

    ENTITY_PATTERNS.forEach(pattern => {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const entity = match[1];
            if (entity && !EXCLUDE_WORDS.has(entity) && entity.length > 2) {
                entities.add(entity);
            }
        }
    });

    return entities;
};

/**
 * Component that renders text with clickable entity mentions
 */
const EntityMention: React.FC<EntityMentionProps> = ({
    text,
    onExploreNode,
    darkMode = false
}) => {
    const entities = extractEntities(text);

    if (entities.size === 0) {
        return <>{text}</>;
    }

    // Create a regex that matches any of the detected entities
    const entityPattern = new RegExp(
        `\\b(${Array.from(entities).map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
        'g'
    );

    const parts = text.split(entityPattern);

    return (
        <>
            {parts.map((part, index) => {
                if (entities.has(part)) {
                    return (
                        <button
                            key={index}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onExploreNode(part);
                            }}
                            className={`
                inline-flex items-center gap-0.5 px-1 py-0.5 rounded
                font-medium transition-all
                hover:scale-105 active:scale-95
                ${darkMode
                                    ? 'text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300'
                                    : 'text-cyan-600 hover:bg-cyan-100 hover:text-cyan-700'
                                }
              `}
                            title={`Explore ${part} in the knowledge graph`}
                        >
                            {part}
                            <span className="material-symbols-outlined text-[12px] opacity-70">
                                hub
                            </span>
                        </button>
                    );
                }
                return <span key={index}>{part}</span>;
            })}
        </>
    );
};

export default EntityMention;
