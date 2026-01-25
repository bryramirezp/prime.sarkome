import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DOCS_CONTENT } from '../constants/docsData';
import DocsSidebar from '../components/DocsSidebar';
import PrimeKGPage from './PrimeKGPage';

interface DocsPageProps {
    darkMode: boolean;
}

export default function DocsPage({ darkMode }: DocsPageProps) {
    const { slug } = useParams<{ slug: string }>();

    // Default to primekg-graph if no slug or invalid slug
    const currentSlug = slug && DOCS_CONTENT[slug] ? slug : 'primekg-graph';
    const content = DOCS_CONTENT[currentSlug];

    useEffect(() => {
        // Scroll to top on navigation
        window.scrollTo(0, 0);
    }, [currentSlug]);

    // Special case: render PrimeKGPage component for primekg-graph
    if (currentSlug === 'primekg-graph') {
        return <PrimeKGPage darkMode={darkMode} />;
    }

    return (
        <div className="min-h-screen flex bg-background text-foreground">

            {/* Docs Sidebar */}
            <DocsSidebar darkMode={darkMode} currentSlug={currentSlug} />

            {/* Main Content */}
            <main className="flex-1 max-w-4xl mx-auto p-6 md:p-12 pb-24">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between mb-8 pb-4 border-b border-border">
                    <Link to="/" className="flex items-center gap-2 text-tertiary">
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back
                    </Link>
                    <span className="font-bold">Documentation</span>
                    {/* Simple mobile menu trigger could go here */}
                    <div className="w-6"></div>
                </div>

                <article className={`prose max-w-none ${darkMode ? 'prose-invert' : 'prose-slate'} 
          prose-headings:font-bold prose-h1:text-4xl prose-h1:mb-8 prose-h2:text-2xl prose-h2:mt-12 prose-a:text-accent prose-a:no-underline hover:prose-a:underline
          prose-img:rounded-xl prose-img:shadow-lg prose-code:text-accent prose-code:bg-surface prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                    </ReactMarkdown>
                </article>

                {/* Navigation Footer */}
                <div className="mt-16 pt-8 border-t border-border flex justify-between">
                    {/* Logic to find prev/next could be added here for better UX */}
                    <div className="text-xs text-tertiary">
                        Updated for PrimeKG Explorer v1.0
                    </div>
                </div>
            </main>
        </div>
    );
}
