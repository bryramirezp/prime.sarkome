import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import { DOCS_CONTENT } from '../constants/docsData';
import DocsSidebar from '../components/DocsSidebar';
import PrimeKGPage from './PrimeKGPage';
import { CodeBlock, Callout } from '../components/DocsComponents';

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
    // Note: We might want to remove this if we fully generate the graph docs from markdown now,
    // but preserving for now as it's a specialized interactive page.
    if (currentSlug === 'primekg-graph') {
        return <PrimeKGPage darkMode={darkMode} />;
    }

    return (
        <div className="min-h-screen flex bg-background text-foreground">

            {/* Docs Sidebar */}
            <DocsSidebar darkMode={darkMode} currentSlug={currentSlug} />

            {/* Main Content */}
            <main className="flex-1 max-w-5xl mx-auto p-6 md:p-12 pb-24 shadow-2xl bg-card border-x border-border/30 min-h-screen">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between mb-8 pb-4 border-b border-border">
                    <Link to="/" className="flex items-center gap-2 text-tertiary">
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back
                    </Link>
                    <span className="font-bold">Documentation</span>
                    <div className="w-6"></div>
                </div>

                <article className={`prose max-w-none ${darkMode ? 'prose-invert' : 'prose-slate'} 
          prose-headings:font-bold prose-h1:text-4xl prose-h1:mb-8 prose-h1:tracking-tight prose-h1:text-primary
          prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border/50 prose-h2:pb-2 prose-h2:text-foreground
          prose-h3:text-xl prose-h3:mt-8 prose-h3:text-foreground/90
          prose-p:text-base prose-p:leading-7 prose-p:text-secondary
          prose-a:text-accent prose-a:font-medium prose-a:no-underline hover:prose-a:underline
          prose-img:rounded-xl prose-img:shadow-lg prose-img:border prose-img:border-border
          prose-table:border-collapse prose-table:w-full prose-table:my-8
          prose-th:bg-surface prose-th:p-3 prose-th:text-left prose-th:border prose-th:border-border prose-th:text-foreground
          prose-td:p-3 prose-td:border prose-td:border-border/50 prose-td:text-secondary
          `}>
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw, rehypeSlug]}
                        components={{
                            code: ({node, className, children, ...props}) => {
                                const match = /language-(\w+)/.exec(className || '')
                                return match ? (
                                    <CodeBlock language={match[1]} darkMode={darkMode}>
                                        {String(children).replace(/\n$/, '')}
                                    </CodeBlock>
                                ) : (
                                    <code className="bg-surface px-1.5 py-0.5 rounded-md text-accent font-mono text-sm border border-border/50" {...props}>
                                        {children}
                                    </code>
                                )
                            },
                            blockquote: ({node, children}) => {
                                // Default to note if not specified
                                // In real usage, you'd parse the first line for "[!NOTE]" etc.
                                // For now, we wrap standard blockquotes as notes
                                return <Callout type='note'>{children}</Callout>
                            },
                            table: ({node, children, ...props}) => (
                                <div className="overflow-x-auto my-8 border border-border rounded-xl shadow-sm">
                                    <table className="w-full text-sm text-left">
                                        {children}
                                    </table>
                                </div>
                            )
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </article>

                {/* Navigation Footer */}
                <div className="mt-24 pt-8 border-t border-border flex justify-between items-center text-sm text-tertiary">
                    <div>
                        Updated for PrimeKG Explorer v1.0
                    </div>
                </div>
            </main>
        </div>
    );
}
