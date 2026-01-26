import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  code: string;
  darkMode?: boolean;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code, darkMode = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: darkMode ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
      themeVariables: darkMode ? {
        primaryColor: '#3b82f6',
        primaryTextColor: '#e2e8f0',
        primaryBorderColor: '#64748b',
        lineColor: '#94a3b8',
        secondaryColor: '#1e293b',
        tertiaryColor: '#0f172a',
      } : {
        primaryColor: '#3b82f6',
        primaryTextColor: '#1e293b',
        primaryBorderColor: '#cbd5e1',
        lineColor: '#64748b',
        secondaryColor: '#f1f5f9',
        tertiaryColor: '#ffffff',
      }
    });

    const renderDiagram = async () => {
      if (!containerRef.current) return;
      
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, code);
        setSvg(svg);
        setIsError(false);
      } catch (error) {
        console.error('Mermaid rendering failed:', error);
        setIsError(true);
      }
    };

    renderDiagram();
  }, [code, darkMode]);

  if (isError) {
    return (
      <div className="p-4 border border-red-200 rounded bg-red-50 text-red-600 text-sm font-mono whitespace-pre-wrap">
        Error rendering graph. Please check syntax.
        {'\n' + code}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`mermaid-diagram w-full flex justify-center p-4 rounded-lg my-4 overflow-x-auto ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default MermaidDiagram;
