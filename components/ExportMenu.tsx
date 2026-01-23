import React, { useState } from 'react';
import { Project } from '../schemas/projectSchema';

interface ExportMenuProps {
    project: Project;
    darkMode?: boolean;
}

/**
 * Export menu for projects - supports JSON, Markdown, and PDF formats
 */
const ExportMenu: React.FC<ExportMenuProps> = ({ project, darkMode = false }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [exporting, setExporting] = useState(false);

    /**
     * Export as JSON
     */
    const exportAsJSON = () => {
        const exportData = {
            ...project,
            exportedAt: new Date().toISOString(),
            version: '1.0',
            source: 'PrimeKG Explorer',
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setShowMenu(false);
    };

    /**
     * Export as Markdown
     */
    const exportAsMarkdown = () => {
        let markdown = `# ${project.name}\n\n`;

        if (project.description) {
            markdown += `${project.description}\n\n`;
        }

        markdown += `**Created:** ${new Date(project.createdAt).toLocaleDateString()}\n`;
        markdown += `**Updated:** ${new Date(project.updatedAt).toLocaleDateString()}\n`;
        markdown += `**Items:** ${project.items.length}\n\n`;

        markdown += `---\n\n`;

        // Group items by type
        const itemsByType = project.items.reduce((acc, item) => {
            if (!acc[item.type]) acc[item.type] = [];
            acc[item.type].push(item);
            return acc;
        }, {} as Record<string, typeof project.items>);

        Object.entries(itemsByType).forEach(([type, items]) => {
            markdown += `## ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`;

            items.forEach((item, idx) => {
                markdown += `### ${idx + 1}. ${item.name}\n\n`;

                if (item.notes) {
                    markdown += `**Notes:** ${item.notes}\n\n`;
                }

                if (item.tags && item.tags.length > 0) {
                    markdown += `**Tags:** ${item.tags.join(', ')}\n\n`;
                }

                markdown += `**Saved:** ${new Date(item.timestamp).toLocaleString()}\n\n`;

                if (item.data) {
                    markdown += `\`\`\`json\n${JSON.stringify(item.data, null, 2)}\n\`\`\`\n\n`;
                }

                markdown += `---\n\n`;
            });
        });

        markdown += `\n*Exported from PrimeKG Explorer on ${new Date().toLocaleString()}*\n`;

        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
        setShowMenu(false);
    };

    /**
     * Export as HTML (for printing or PDF conversion)
     */
    const exportAsHTML = () => {
        setExporting(true);

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name} - PrimeKG Research Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #0f172a;
    }
    h2 {
      font-size: 24px;
      font-weight: 600;
      margin-top: 32px;
      margin-bottom: 16px;
      color: #334155;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
    }
    h3 {
      font-size: 18px;
      font-weight: 600;
      margin-top: 24px;
      margin-bottom: 12px;
      color: #475569;
    }
    .meta {
      color: #64748b;
      font-size: 14px;
      margin-bottom: 24px;
    }
    .description {
      font-size: 16px;
      color: #475569;
      margin-bottom: 24px;
      padding: 16px;
      background: #f8fafc;
      border-left: 4px solid ${project.color || '#6366f1'};
      border-radius: 4px;
    }
    .item {
      margin-bottom: 32px;
      padding: 20px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    .item-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .item-icon {
      font-size: 24px;
    }
    .item-type {
      display: inline-block;
      padding: 4px 12px;
      background: #f1f5f9;
      color: #64748b;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }
    .notes {
      margin-top: 12px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 4px;
      font-size: 14px;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .tag {
      padding: 4px 12px;
      background: #e0e7ff;
      color: #4f46e5;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .timestamp {
      color: #94a3b8;
      font-size: 12px;
      margin-top: 8px;
    }
    .data-preview {
      margin-top: 12px;
      padding: 12px;
      background: #0f172a;
      color: #e2e8f0;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      overflow-x: auto;
      max-height: 300px;
      overflow-y: auto;
    }
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
    }
    @media print {
      body { padding: 20px; }
      .item { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>${project.name}</h1>
  <div class="meta">
    Created: ${new Date(project.createdAt).toLocaleDateString()} • 
    Updated: ${new Date(project.updatedAt).toLocaleDateString()} • 
    ${project.items.length} item${project.items.length !== 1 ? 's' : ''}
  </div>
  
  ${project.description ? `<div class="description">${project.description}</div>` : ''}

  ${Object.entries(
            project.items.reduce((acc, item) => {
                if (!acc[item.type]) acc[item.type] = [];
                acc[item.type].push(item);
                return acc;
            }, {} as Record<string, typeof project.items>)
        ).map(([type, items]) => `
    <h2>${type.charAt(0).toUpperCase() + type.slice(1)}s</h2>
    ${items.map((item, idx) => `
      <div class="item">
        <div class="item-header">
          <span class="item-icon">${getItemIcon(item.type)}</span>
          <h3>${item.name}</h3>
          <span class="item-type">${type}</span>
        </div>
        
        ${item.notes ? `<div class="notes"><strong>Notes:</strong> ${item.notes}</div>` : ''}
        
        ${item.tags && item.tags.length > 0 ? `
          <div class="tags">
            ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        ` : ''}
        
        <div class="timestamp">Saved: ${new Date(item.timestamp).toLocaleString()}</div>
        
        ${item.data ? `
          <details>
            <summary style="cursor: pointer; margin-top: 12px; font-size: 14px; color: #64748b;">View Data</summary>
            <div class="data-preview">${JSON.stringify(item.data, null, 2)}</div>
          </details>
        ` : ''}
      </div>
    `).join('')}
  `).join('')}

  <div class="footer">
    Exported from <strong>PrimeKG Explorer</strong> on ${new Date().toLocaleString()}<br>
    <a href="https://prime.sarkome.com" style="color: #6366f1;">prime.sarkome.com</a>
  </div>
</body>
</html>
    `;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        // Open in new window for printing
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                    setExporting(false);
                    setShowMenu(false);
                }, 500);
            };
        } else {
            // Fallback: download HTML file
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.html`;
            a.click();
            setExporting(false);
            setShowMenu(false);
        }

        URL.revokeObjectURL(url);
    };

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'entity': return '🧬';
            case 'path': return '🛤️';
            case 'hypothesis': return '💡';
            case 'message': return '💬';
            case 'graph': return '🕸️';
            default: return '📄';
        }
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setShowMenu(!showMenu)}
                disabled={exporting}
                className={`
          inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium
          transition-colors
          bg-surface text-secondary hover:bg-surface-hover
                    }
          ${exporting ? 'opacity-50 cursor-not-allowed' : ''}
        `}
            >
                <span className="material-symbols-outlined text-[18px]">
                    {exporting ? 'hourglass_empty' : 'download'}
                </span>
                <span>{exporting ? 'Exporting...' : 'Export'}</span>
            </button>

            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                    />

                    <div className={`
            absolute right-0 mt-1 w-48 rounded-lg shadow-lg border z-50
            bg-surface border-border
          `}>
                        <div className="p-1">
                            <button
                                onClick={exportAsJSON}
                                className={`
                  w-full text-left px-3 py-2 rounded text-sm
                  flex items-center gap-2
                  hover:bg-surface-hover text-secondary
                `}
                            >
                                <span className="material-symbols-outlined text-[18px]">code</span>
                                <span>Export as JSON</span>
                            </button>

                            <button
                                onClick={exportAsMarkdown}
                                className={`
                  w-full text-left px-3 py-2 rounded text-sm
                  flex items-center gap-2
                  ${darkMode
                                        ? 'hover:bg-zinc-800 text-slate-300'
                                        : 'hover:bg-slate-100 text-slate-700'
                                    }
                `}
                            >
                                <span className="material-symbols-outlined text-[18px]">description</span>
                                <span>Export as Markdown</span>
                            </button>

                            <button
                                onClick={exportAsHTML}
                                className={`
                  w-full text-left px-3 py-2 rounded text-sm
                  flex items-center gap-2
                  ${darkMode
                                        ? 'hover:bg-zinc-800 text-slate-300'
                                        : 'hover:bg-slate-100 text-slate-700'
                                    }
                `}
                            >
                                <span className="material-symbols-outlined text-[18px]">print</span>
                                <span>Print / Save as PDF</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ExportMenu;
