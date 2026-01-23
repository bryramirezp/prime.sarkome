import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DOCS_SECTIONS } from '../constants/docsData';

interface DocsSidebarProps {
    darkMode?: boolean;
    currentSlug?: string;
}

export default function DocsSidebar({ darkMode, currentSlug }: DocsSidebarProps) {
    const location = useLocation();

    // Group sections by category
    const sectionsByCategory = DOCS_SECTIONS.reduce((acc, section) => {
        if (!acc[section.category]) acc[section.category] = [];
        acc[section.category].push(section);
        return acc;
    }, {} as Record<string, typeof DOCS_SECTIONS>);

    return (
        <aside className={`w-64 flex-shrink-0 border-r h-screen sticky top-0 overflow-y-auto hidden md:block border-border bg-[rgb(var(--color-bg-main))]`}>
            <div className="p-6">
                <Link to="/" className="flex items-center gap-2 mb-8 group">
                    <span className="material-symbols-outlined text-tertiary group-hover:text-primary transition-colors">arrow_back</span>
                    <span className="font-medium text-sm text-tertiary group-hover:text-primary transition-colors">Back to App</span>
                </Link>

                <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-accent">library_books</span>
                    Documentation
                </h2>

                <div className="space-y-8">
                    {Object.entries(sectionsByCategory).map(([category, items]) => (
                        <div key={category}>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-3 pl-2">
                                {category}
                            </h3>
                            <div className="space-y-1">
                                {items.map((item) => (
                                    <Link
                                        key={item.id}
                                        to={`/docs/${item.id}`}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${currentSlug === item.id || location.pathname === `/docs/${item.id}`
                                                ? 'bg-accent/10 text-accent'
                                                : 'text-secondary hover:bg-surface-hover hover:text-primary'
                                            }`}
                                    >
                                        <span className={`material-symbols-outlined text-[18px] ${currentSlug === item.id || location.pathname === `/docs/${item.id}` ? 'text-accent' : 'text-tertiary'}`}>
                                            {item.icon}
                                        </span>
                                        {item.title}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
}
