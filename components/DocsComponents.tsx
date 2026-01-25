import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula, atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
    language?: string;
    children: string;
    darkMode?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, children, darkMode = true }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-4 rounded-xl overflow-hidden shadow-lg border border-border">
            <div className="flex items-center justify-between px-4 py-2 bg-[#282a36] border-b border-white/10">
                <span className="text-xs font-mono text-muted-foreground uppercase">{language || 'text'}</span>
                <button
                    onClick={handleCopy}
                    className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1"
                >
                    <span className="material-symbols-outlined text-[14px]">
                        {copied ? 'check' : 'content_copy'}
                    </span>
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <SyntaxHighlighter
                language={language}
                style={dracula} // Using dracula as a safe default for dark-themed UI
                customStyle={{
                    margin: 0,
                    padding: '1.5rem',
                    background: '#1e1e2e', // Match closer to our surface color if possible
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                }}
                showLineNumbers={true}
                lineNumberStyle={{ color: '#6272a4', minWidth: '2em' }}
            >
                {children}
            </SyntaxHighlighter>
        </div>
    );
};

interface CalloutProps {
    type?: 'note' | 'tip' | 'warning' | 'important';
    title?: string;
    children: React.ReactNode;
}

export const Callout: React.FC<CalloutProps> = ({ type = 'note', title, children }) => {
    const styles = {
        note: {
            border: 'border-blue-500/50',
            bg: 'bg-blue-500/10',
            text: 'text-blue-400',
            icon: 'info'
        },
        tip: {
            border: 'border-emerald-500/50',
            bg: 'bg-emerald-500/10',
            text: 'text-emerald-400',
            icon: 'lightbulb'
        },
        warning: {
            border: 'border-amber-500/50',
            bg: 'bg-amber-500/10',
            text: 'text-amber-400',
            icon: 'warning'
        },
        important: {
            border: 'border-purple-500/50',
            bg: 'bg-purple-500/10',
            text: 'text-purple-400',
            icon: 'bookmarks'
        }
    };

    const style = styles[type] || styles.note;

    return (
        <div className={`my-6 rounded-lg border-l-4 ${style.border} ${style.bg} p-4`}>
            {title && (
                <div className={`flex items-center gap-2 font-bold mb-2 ${style.text}`}>
                    <span className="material-symbols-outlined text-[20px]">{style.icon}</span>
                    {title}
                </div>
            )}
            <div className="text-sm md:text-base opacity-90 leading-relaxed">
                {children}
            </div>
        </div>
    );
};
