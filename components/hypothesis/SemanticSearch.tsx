import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { kgService } from '../../services/kgService';
import { SearchResult } from '../../types';

interface SemanticSearchProps {
    onSelect: (result: SearchResult) => void;
    placeholder?: string;
}

const SemanticSearch: React.FC<SemanticSearchProps> = ({ onSelect, placeholder = "Search for disease, drug, or gene..." }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleSearch = async (text: string) => {
        setQuery(text);
        if (!text.trim()) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        setIsOpen(true);
        try {
            // Use semantic search endpoint
            const data = await kgService.searchSemantic(text);
            setResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="relative w-full group z-50">
            <div className={`relative flex items-center w-full h-[50px] rounded-xl border bg-surface transition-all overflow-hidden ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500/50 rounded-b-none' : 'border-border focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50'}`}>
                <div className="pl-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors">
                    <Search size={20} />
                </div>
                <input 
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => query && setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full h-full bg-transparent px-4 text-primary placeholder-muted-foreground outline-none font-medium"
                />
                {isSearching && (
                    <div className="pr-4">
                        <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {isOpen && query && (
                <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 z-50 bg-surface border border-t-0 border-border rounded-b-xl shadow-xl overflow-hidden max-h-[300px] overflow-y-auto">
                        {results.length > 0 ? (
                            results.map((result, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        onSelect(result);
                                        setQuery(result.name);
                                        setIsOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-surface-hover flex items-center gap-3 border-b border-border/50 last:border-0 transition-colors"
                                >
                                    <div className="p-1.5 rounded bg-surface-hover/50 text-indigo-500/70 border border-indigo-500/10">
                                        <span className="material-symbols-outlined text-[18px]">
                                            {result.type === 'disease' ? 'coronavirus' : 
                                             result.type === 'drug' ? 'medication' : 
                                             'biotech'}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-primary">{result.name}</div>
                                        <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider bg-indigo-500/5 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                                            {result.type}
                                        </div>
                                    </div>
                                    {result.score && (
                                        <div className="ml-auto text-[10px] text-tertiary">
                                            Match: {Math.round(result.score * 100)}%
                                        </div>
                                    )}
                                </button>
                            ))
                        ) : !isSearching && (
                            <div className="px-4 py-8 text-center text-sm text-tertiary">
                                No semantic matches found.
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default SemanticSearch;
