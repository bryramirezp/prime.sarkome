import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FAQ_DATA } from '../constants/faqData';

interface FaqPageProps {
    darkMode: boolean;
}

export default function FaqPage({ darkMode }: FaqPageProps) {
    const [expandedId, setExpandedId] = useState<string | null>('hallucination');
    const [searchQuery, setSearchQuery] = useState('');

    // Group FAQs by category
    const categories = Array.from(new Set(FAQ_DATA.map(faq => faq.category)));

    // Filter FAQs by search query
    const filteredFaqs = FAQ_DATA.filter(faq => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            faq.question.toLowerCase().includes(query) ||
            faq.answer.toLowerCase().includes(query) ||
            faq.keywords.some(kw => kw.toLowerCase().includes(query))
        );
    });

    return (
        <div className="min-h-screen bg-background text-foreground">

            {/* Header */}
            <div className="border-b sticky top-0 z-10 backdrop-blur-xl border-border bg-background/80">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-tertiary hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span className="font-medium">Back to App</span>
                    </Link>
                    <h1 className="font-bold text-lg">Frequently Asked Questions</h1>
                    <div className="w-20"></div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">

                {/* Intro */}
                <div className="mb-12 text-center">
                    <h2 className="text-4xl font-bold mb-4">
                        Technical FAQ & <span className="text-indigo-500 dark:text-indigo-400">Knowledge Integrity</span>
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Deterministic answers for the Technical Physician.
                    </p>
                </div>

                {/* Search */}
                <div className="mb-8">
                    <div className="relative bg-card rounded-xl border border-border shadow-sm">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Search FAQs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-transparent outline-none text-foreground placeholder-muted-foreground"
                        />
                    </div>
                </div>

                {/* FAQs by Category */}
                {categories.map(category => {
                    const categoryFaqs = filteredFaqs.filter(faq => faq.category === category);
                    if (categoryFaqs.length === 0) return null;

                    return (
                        <div key={category} className="mb-12">
                            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-muted-foreground">
                                {category}
                            </h3>
                            <div className="space-y-3">
                                {categoryFaqs.map(faq => (
                                    <div
                                        key={faq.id}
                                        className={`rounded-xl border transition-all ${expandedId === faq.id
                                                ? 'border-indigo-500/30 bg-indigo-500/5'
                                                : 'border-border bg-card hover:border-slate-300 dark:hover:border-slate-700'
                                            }`}
                                    >
                                        <button
                                            onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                                            className="w-full text-left px-6 py-4 flex items-center justify-between gap-4"
                                        >
                                            <span className="font-semibold text-lg">{faq.question}</span>
                                            <span className={`material-symbols-outlined transition-transform ${expandedId === faq.id ? 'rotate-180' : ''}`}>
                                                expand_more
                                            </span>
                                        </button>

                                        {expandedId === faq.id && (
                                            <div className="px-6 pb-6 border-t border-border">
                                                <div className="prose max-w-none mt-4 dark:prose-invert prose-headings:font-bold prose-a:text-indigo-500 prose-a:no-underline hover:prose-a:underline prose-strong:text-indigo-500">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {faq.answer}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {filteredFaqs.length === 0 && (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-muted-foreground mb-4">search_off</span>
                        <p className="text-muted-foreground">
                            No FAQs found matching "{searchQuery}"
                        </p>
                    </div>
                )}

                {/* CTA */}
                <div className="mt-16 p-8 rounded-2xl border text-center border-indigo-500/30 bg-indigo-500/5">
                    <h3 className="text-2xl font-bold mb-3">Still have questions?</h3>
                    <p className="mb-6 text-muted-foreground">
                        Try asking PrimeAI directly or check out our documentation
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link
                            to="/chat"
                            className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400 transition-all shadow-lg hover:shadow-xl"
                        >
                            Ask PrimeAI
                        </Link>
                        <Link
                            to="/docs"
                            className="px-6 py-3 rounded-xl font-medium border transition-all border-border hover:bg-accent hover:text-accent-foreground"
                        >
                            Read Documentation
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
