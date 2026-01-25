import React from 'react';
import { CitationTooltip } from './CitationTooltip';
import type { EntityType } from '../types/pubmed';

/**
 * Detects and makes entity mentions clickable in AI responses.
 * Allows users to explore nodes directly from the text.
 * Now includes literature preview tooltips on hover.
 */

interface EntityMentionProps {
    text: string;
    onExploreNode: (nodeName: string) => void;
    darkMode?: boolean;
    showLiteratureTooltips?: boolean;
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
 * Determine entity type based on pattern matching
 */
const guessEntityType = (entity: string): EntityType => {
    // All caps likely a gene
    if (/^[A-Z]{2,6}[0-9]{0,2}$/.test(entity)) {
        return 'gene';
    }
    // Drug suffixes
    if (/(?:mab|nib|tinib|olol|pril|statin|cillin|mycin|cycline)$/i.test(entity)) {
        return 'drug';
    }
    // Multi-word capitalized likely a disease
    if (/\s/.test(entity)) {
        return 'disease';
    }
    // Default to gene for single capitalized words
    return 'gene';
};

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
    darkMode = false,
    showLiteratureTooltips = true
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
                    const entityType = guessEntityType(part);
                    const button = (
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
                hover:scale-105 active:scale-95
                text-primary hover:bg-primary/10
                dark:text-blue-300 dark:bg-blue-400/10 dark:hover:bg-blue-400/20
              `}
                            title={`Explore ${part} in the knowledge graph`}
                        >
                            {part}
                            <span className="material-symbols-outlined text-[12px] opacity-70">
                                hub
                            </span>
                        </button>
                    );

                    // Wrap with CitationTooltip if enabled
                    if (showLiteratureTooltips) {
                        return (
                            <CitationTooltip
                                key={index}
                                entityName={part}
                                entityType={entityType}
                            >
                                {button}
                            </CitationTooltip>
                        );
                    }

                    return button;
                }
                return <span key={index}>{part}</span>;
            })}
        </>
    );
};

export default EntityMention;

