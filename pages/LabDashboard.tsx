

import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Shield, Share2, Dna, BookOpen, MessageSquareText, FlaskConical } from 'lucide-react';
import { useApiKey } from '../contexts/ApiKeyContext';
import { LayoutContext } from '../components/Layout';
import TechFooter from '../components/TechFooter';

export default function LabDashboard() {
  const { isValid } = useApiKey();
  const { onShowApiKeyModal } = useOutletContext<LayoutContext>();

  return (
    <div className="min-h-full w-full flex flex-col font-sans text-muted-foreground relative bg-background">
      
      <main className="flex-grow flex flex-col items-center justify-start pt-16 pb-12 relative w-full max-w-5xl mx-auto px-4 z-10">
        
        {/* Simple Title - Optional, if you want totally blank remove this block */}
        <div className="text-center z-10 mb-6 sm:mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
            PrimeKG Bio-Lab
          </h1>
        </div>

        {/* Status Badge - Moved to top */}
        <div className="mb-8 z-10">
          <div className="inline-flex items-center gap-2 backdrop-blur-md px-4 py-2 rounded-full border shadow-sm transition-colors bg-card/80 border-border">
            
            {/* Graph Status - Always Connected */}
            <div className="flex items-center gap-2 pr-3 border-r border-border">
              <span className="text-xs font-bold text-foreground tracking-wider">GRAPH</span>
               <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">Online</span>
            </div>

            {/* AI Status - Depends on Key */}
            <div className="flex items-center gap-2 pl-1">
               <span className="text-xs font-bold text-foreground tracking-wider">AI AGENT</span>
               {isValid ? (
                 <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">Ready</span>
               ) : (
                  <button
                  onClick={onShowApiKeyModal}
                  className="hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold px-2 py-0.5 rounded transition-colors ml-1 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                >
                  Connect Gemini
                </button>
               )}
            </div>

          </div>
        </div>

        {/* 2x2 Grid Centered */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-4xl">
          
          {/* Card 1: Inference */}
          <Link
            to="/chat"
             className={`group flex flex-col p-5 sm:p-8 bg-card border rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 active:scale-[0.98] ${
              !isValid ? 'border-orange-200/50 dark:border-orange-900/30' : 'border-border'
            }`}
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                <MessageSquareText size={28} className="sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-blue-600 transition-colors">
                Hallucination-Free AI <br/>
                <span className="text-sm font-normal text-muted-foreground group-hover:text-blue-500/80">via Graph Grounding</span>
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Standard LLMs predict probable words; we retrieve verified facts. Every answer is strictly constrained to nodes and edges within the PrimeKG Knowledge Graph, eliminating generative fabrication.
            </p>
             {!isValid && (
              <div className="mt-4 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-md inline-block w-fit">
                 ⚠️ AI Key Required for this feature
              </div>
            )}
          </Link>

          {/* Card 2: Navigator */}
          <Link
            to="/graph"
            className="group flex flex-col p-5 sm:p-8 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
               <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
                <Share2 size={32} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-emerald-600 transition-colors">
                Relational Navigator
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Visualize connections between drugs, diseases, and phenotypes.
            </p>
          </Link>

          {/* Card 3: Experimental (formerly Hypothesis Simulator) */}
          <Link
            to="/HypothesisSimulator"
             className="group flex flex-col p-5 sm:p-8 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="p-3 bg-pink-50 dark:bg-pink-900/20 text-pink-600 rounded-lg">
                <FlaskConical size={32} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-pink-600 transition-colors">
                Experimental
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Interactive games to validate biological connections. All hypotheses must be grounded in PrimeKG evidence.
            </p>
          </Link>

          {/* Card 3.5: Molecular Simulator (New Duplicate) */}
          <Link
            to="/molecular"
             className="group flex flex-col p-5 sm:p-8 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg">
                <Dna size={32} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-red-600 transition-colors">
                Molecular Simulator
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Explore mechanistic pathways and molecular interactions in a sandbox environment.
            </p>
          </Link>

          {/* Card 4: Evidence */}
          <Link
            to="/docs"
             className="group flex flex-col p-5 sm:p-8 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
               <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                <BookOpen size={32} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-purple-600 transition-colors">
                Evidence Audit
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Check source publications directly from PubMed.
            </p>
          </Link>

        </div>
      </main>

      {/* Tech Footer */}
      <TechFooter />
    </div>
  );
}

