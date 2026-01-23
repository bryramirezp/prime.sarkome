/**
 * Literature Panel Component
 * Displays scientific literature citations for biomedical entities
 * @module components/LiteraturePanel
 */

import React, { useState } from 'react';
import { useEntityCitations } from '../hooks/usePubMed';
import type { DisplayCitation, EntityType } from '../types/pubmed';

interface LiteraturePanelProps {
  entityName: string;
  entityType?: EntityType;
  maxResults?: number;
  className?: string;
}

export function LiteraturePanel({ 
  entityName, 
  entityType = 'gene',
  maxResults = 5,
  className = ''
}: LiteraturePanelProps) {
  const { data, isLoading, error, refetch } = useEntityCitations(
    entityName, 
    entityType, 
    maxResults
  );

  if (isLoading) {
    return <LiteratureSkeleton count={3} />;
  }

  if (error) {
    return (
      <ErrorCard 
        message="Failed to load literature" 
        onRetry={() => refetch()} 
      />
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState entityName={entityName} />;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-xl">science</span>
          Scientific Literature
        </h3>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-surface-hover text-secondary">
          {data.length} papers
        </span>
      </div>

      <div className="space-y-2">
        {data.map((citation, index) => (
          <CitationCard key={citation.id} citation={citation} index={index} />
        ))}
      </div>

      <SearchMoreLink entityName={entityName} />
    </div>
  );
}

/**
 * Individual citation card with expandable abstract
 */
function CitationCard({ citation, index }: { citation: DisplayCitation; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden hover:border-accent/50 transition-colors animate-fade-in-up"
         style={{ animationDelay: `${index * 50}ms` }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 text-left hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-start gap-2">
          <span className="text-tertiary text-sm font-mono flex-shrink-0">
            {index + 1}.
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm leading-tight line-clamp-2 text-primary">
              {citation.title}
            </p>
            <p className="text-xs text-secondary mt-1">
              {citation.authors} • {citation.journal} • {citation.year}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {citation.isOpenAccess && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                  Open Access
                </span>
              )}
              {citation.citedByCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                  {citation.citedByCount} citations
                </span>
              )}
              {citation.tags.map((tag, i) => (
                tag !== 'Open Access' && (
                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface text-secondary">
                    {tag}
                  </span>
                )
              ))}
            </div>
          </div>
          <span className={`material-symbols-outlined text-tertiary transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border bg-surface/50">
          {citation.abstract ? (
            <div className="space-y-3 pt-3">
              <p className="text-sm text-secondary leading-relaxed">
                {citation.abstract}
              </p>
              <div className="flex flex-wrap gap-3">
                {citation.pdfUrl && (
                  <a 
                    href={citation.pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                    PDF
                  </a>
                )}
                {citation.pmcUrl && (
                  <a 
                    href={citation.pmcUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <span className="material-symbols-outlined text-sm">article</span>
                    Full Text
                  </a>
                )}
                {citation.doiUrl && (
                  <a 
                    href={citation.doiUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <span className="material-symbols-outlined text-sm">link</span>
                    DOI
                  </a>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-tertiary italic pt-3">
              No abstract available
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Loading skeleton for citations
 */
function LiteratureSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-border rounded-lg p-4 space-y-2 animate-subtle-pulse">
          <div className="h-4 bg-surface-hover rounded w-3/4"></div>
          <div className="h-3 bg-surface-hover rounded w-1/2"></div>
          <div className="flex gap-2">
            <div className="h-5 bg-surface-hover rounded w-16"></div>
            <div className="h-5 bg-surface-hover rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no papers found
 */
function EmptyState({ entityName }: { entityName: string }) {
  return (
    <div className="border border-dashed border-border rounded-lg p-8 text-center">
      <span className="material-symbols-outlined text-4xl text-tertiary">
        library_books
      </span>
      <p className="mt-2 text-sm text-secondary">
        No papers found for "{entityName}"
      </p>
      <a 
        href={`https://europepmc.org/search?query=${encodeURIComponent(entityName)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-accent hover:underline mt-2 inline-block"
      >
        Search on Europe PMC →
      </a>
    </div>
  );
}

/**
 * Error card with retry button
 */
function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="border border-red-200 dark:border-red-900/50 rounded-lg p-6 text-center bg-red-50/50 dark:bg-red-900/10">
      <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">
        error
      </span>
      <p className="mt-2 text-sm text-secondary">{message}</p>
      <button 
        onClick={onRetry}
        className="mt-3 text-xs text-accent hover:underline"
      >
        Try again
      </button>
    </div>
  );
}

/**
 * Link to search more on Europe PMC
 */
function SearchMoreLink({ entityName }: { entityName: string }) {
  return (
    <div className="text-center pt-2">
      <a 
        href={`https://europepmc.org/search?query=${encodeURIComponent(entityName)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-secondary hover:text-accent transition-colors inline-flex items-center gap-1"
      >
        View more on Europe PMC
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </a>
    </div>
  );
}

export default LiteraturePanel;
