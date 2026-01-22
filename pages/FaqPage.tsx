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
        <div className={`min-h-screen ${darkMode ? 'bg-zinc-950 text-slate-200' : 'bg-slate-50 text-slate-900'}`}>

            {/* Header */}
            <div className={`border-b sticky top-0 z-10 backdrop-blur-xl ${darkMode ? 'border-zinc-800 bg-zinc-900/80' : 'border-slate-200 bg-white/80'}`}>
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
                        Got Questions About <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Hallucination-Free AI</span>?
                    </h2>
                    <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Everything you need to know about PrimeKG Explorer
                    </p>
                </div>

                {/* Search */}
                <div className="mb-8">
                    <div className={`relative ${darkMode ? 'bg-zinc-900' : 'bg-white'} rounded-xl border ${darkMode ? 'border-zinc-800' : 'border-slate-200'} shadow-sm`}>
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Search FAQs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-12 pr-4 py-3 rounded-xl bg-transparent outline-none ${darkMode ? 'text-slate-200 placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
                        />
                    </div>
                </div>

                {/* FAQs by Category */}
                {categories.map(category => {
                    const categoryFaqs = filteredFaqs.filter(faq => faq.category === category);
                    if (categoryFaqs.length === 0) return null;

                    return (
                        <div key={category} className="mb-12">
                            <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                {category}
                            </h3>
                            <div className="space-y-3">
                                {categoryFaqs.map(faq => (
                                    <div
                                        key={faq.id}
                                        className={`rounded-xl border transition-all ${expandedId === faq.id
                                                ? darkMode
                                                    ? 'border-indigo-500/30 bg-indigo-500/5'
                                                    : 'border-indigo-300 bg-indigo-50'
                                                : darkMode
                                                    ? 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                                                    : 'border-slate-200 bg-white hover:border-slate-300'
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
                                            <div className={`px-6 pb-6 border-t ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
                                                <div className={`prose max-w-none mt-4 ${darkMode ? 'prose-invert' : 'prose-slate'} prose-headings:font-bold prose-a:text-indigo-500 prose-a:no-underline hover:prose-a:underline prose-strong:text-indigo-500`}>
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
                        <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">search_off</span>
                        <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                            No FAQs found matching "{searchQuery}"
                        </p>
                    </div>
                )}

                {/* CTA */}
                <div className={`mt-16 p-8 rounded-2xl border text-center ${darkMode ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-indigo-200 bg-indigo-50'}`}>
                    <h3 className="text-2xl font-bold mb-3">Still have questions?</h3>
                    <p className={`mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
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
                            className={`px-6 py-3 rounded-xl font-medium border transition-all ${darkMode ? 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-100'}`}
                        >
                            Read Documentation
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
