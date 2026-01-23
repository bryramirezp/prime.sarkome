/**
 * Citation Tooltip Component
 * Shows a preview of scientific literature on hover
 * @module components/CitationTooltip
 */

import React, { useState } from 'react';
import { useEntityCitations, usePrefetchCitation } from '../hooks/usePubMed';
import type { EntityType } from '../types/pubmed';

interface CitationTooltipProps {
  entityName: string;
  entityType?: EntityType;
  children: React.ReactNode;
  disabled?: boolean;
}

export function CitationTooltip({ 
  entityName, 
  entityType = 'gene',
  children,
  disabled = false
}: CitationTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  const prefetch = usePrefetchCitation();
  const { data, isLoading } = useEntityCitations(
    isVisible ? entityName : null, 
    entityType, 
    2
  );

  const handleMouseEnter = () => {
    if (disabled) return;
    
    // Prefetch immediately
    prefetch(entityName, entityType, 2);
    
    // Show tooltip after delay
    const id = setTimeout(() => {
      setIsVisible(true);
    }, 500);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div 
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 animate-fade-in"
          role="tooltip"
        >
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl p-3">
            <div className="space-y-2">
              <p className="text-xs font-medium flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                <span className="material-symbols-outlined text-sm">science</span>
                Related Literature
              </p>
              
              {isLoading ? (
                <div className="space-y-1">
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full animate-subtle-pulse"></div>
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 animate-subtle-pulse"></div>
                </div>
              ) : data && data.length > 0 ? (
                <ul className="space-y-2">
                  {data.slice(0, 2).map((citation) => (
                    <li key={citation.id} className="text-xs border-l-2 border-indigo-500 pl-2">
                      <span className="line-clamp-1 text-zinc-900 dark:text-zinc-100 font-medium">
                        {citation.title}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400 text-xs">
                        {citation.year} • {citation.citedByCount} citations
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  No papers found
                </p>
              )}

              {data && data.length > 2 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  +{data.length - 2} more
                </span>
              )}
            </div>
            
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-8 border-transparent border-t-white dark:border-t-zinc-900"></div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full border-8 border-transparent border-t-zinc-200 dark:border-t-zinc-800"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CitationTooltip;
