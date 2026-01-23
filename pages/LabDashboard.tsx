import React from 'react';
import { Link } from 'react-router-dom';

const modules = [
  {
    id: 'molecular-detective',
    title: 'Molecular Detective',
    description: 'AI-powered reasoning and semantic exploration of the knowledge graph.',
    icon: (
      <svg className="w-8 h-8 text-cyan-600 dark:text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 4v.01" />
      </svg>
    ),
    path: '/chat',
    color: 'from-cyan-500/20 to-blue-500/20',
    borderColor: 'border-cyan-500/30'
  },
  {
    id: 'network-navigator',
    title: 'Network Navigator',
    description: 'Relational visualization of deep biological networks and subgraphs.',
    icon: (
      <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <circle cx="19" cy="5" r="2" />
        <circle cx="5" cy="19" r="2" />
        <path d="M17 7l-3 3M7 17l3-3" />
      </svg>
    ),
    path: '/graph',
    color: 'from-emerald-500/20 to-teal-500/20',
    borderColor: 'border-emerald-500/30'
  },
  {
    id: 'hypothesis-simulator',
    title: 'Hypothesis Lab',
    description: 'Gamified discovery mode. Validate new drug-disease connections.',
    icon: (
      <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.634.317a2 2 0 01-.894.212H9M9 15.5V7a2 2 0 012-2h3.9a2 2 0 011.69.94l.692 1.2a2 2 0 001.69.94H21a2 2 0 012 2v1.5a2 2 0 01-2 2h-2m-12-7V4" />
      </svg>
    ),
    path: '/game',
    color: 'from-amber-500/20 to-orange-500/20',
    borderColor: 'border-amber-500/30'
  },
  {
    id: 'archive-access',
    title: 'Archive Access',
    description: 'Direct PubMed / Europe PMC integration for literature grounding.',
    icon: (
      <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    path: '/docs',
    color: 'from-purple-500/20 to-fuchsia-500/20',
    borderColor: 'border-purple-500/30'
  }
];

export default function LabDashboard() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold text-primary mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400">
          PrimeKG Bio-Command Center
        </h1>
        <p className="text-secondary max-w-2xl leading-relaxed">
          Welcome back, Researcher. Your secure session is active. Choose a laboratory module to begin your precision medicine discovery.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((module) => (
          <Link
            key={module.id}
            to={module.path}
            className={`group p-8 bg-surface border border-border rounded-2xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden shadow-xl hover:shadow-2xl`}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
            
            <div className="relative z-10">
              <div className="mb-6 p-3 bg-surface-hover/50 rounded-xl inline-block group-hover:scale-110 transition-transform shadow-inner">
                {module.icon}
              </div>
              <h3 className="text-2xl font-bold text-primary mb-3 flex items-center gap-2">
                {module.title}
                <svg className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </h3>
              <p className="text-secondary leading-relaxed">
                {module.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 p-6 bg-surface/50 border border-border rounded-2xl flex items-center justify-between">
        <div>
          <h4 className="text-accent font-semibold mb-1 uppercase tracking-widest text-xs">Research Status</h4>
          <p className="text-tertiary text-sm">All systems nominal. High-precision grounding active via Gemini Flash.</p>
        </div>
        <div className="flex gap-4">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              API Connected
            </span>
        </div>
      </div>
    </div>
  );
}
