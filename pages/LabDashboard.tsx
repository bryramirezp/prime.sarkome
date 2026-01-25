

import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Shield, Share2, Dna, BookOpen, MessageSquareText, FlaskConical, ChevronDown, Gamepad2, BrainCircuit } from 'lucide-react';
import { useApiKey } from '../contexts/ApiKeyContext';
import { LayoutContext } from '../components/Layout';
import TechFooter from '../components/TechFooter';

export default function LabDashboard() {
  const { isValid } = useApiKey();
  const { onShowApiKeyModal } = useOutletContext<LayoutContext>();
  const [showExperimentalMenu, setShowExperimentalMenu] = useState(false);

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
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                Fact-Grounding
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300">
                Knowledge Retrieval
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                Verified Synthesis
              </span>
            </div>
             {!isValid && (
              <div className="mt-4 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-md inline-block w-fit">
                 ⚠️ AI Key Required for this feature
              </div>
            )}
          </Link>

          {/* Card 2: Discovery Map */}
          <Link
            to="/graph"
            className="group flex flex-col p-5 sm:p-8 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
               <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
                <Share2 size={32} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-emerald-600 transition-colors">
                Precision Discovery Map
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Navigate 8.1M+ biological relationships to discover drug repurposing candidates, identify therapeutic targets, and map disease-drug pathways with 1-hop precision.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                Repurposing
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                Target Discovery
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                Path-Finding
              </span>
            </div>
          </Link>

          {/* Card 3: Experimental Games Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExperimentalMenu(!showExperimentalMenu)}
              className={`w-full text-left group flex flex-col p-5 sm:p-8 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 active:scale-[0.98] ${showExperimentalMenu ? 'ring-2 ring-pink-500/20 border-pink-500/50' : ''}`}
            >
              <div className="flex items-center justify-between w-full mb-3 sm:mb-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-3 bg-pink-50 dark:bg-pink-900/20 text-pink-600 rounded-lg">
                    <FlaskConical size={32} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-pink-600 transition-colors">
                    Experimental
                  </h3>
                </div>
                <ChevronDown className={`text-muted-foreground transition-transform duration-300 ${showExperimentalMenu ? 'rotate-180 text-pink-600' : ''}`} />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Interactive games to validate biological connections. Resolve clinical cases and learn through simulation.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300">
                  Learning Games
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  Case Solving
                </span>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showExperimentalMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setShowExperimentalMenu(false)}
                />
                <div className="absolute left-0 right-0 mt-2 p-2 bg-card border border-border rounded-xl shadow-xl z-50 animate-in fade-in zoom-in duration-200 origin-top">
                  <div className="grid grid-cols-1 gap-1">
                    <Link
                      to="/HypothesisSimulator"
                      className="flex items-start gap-4 p-4 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 group/item transition-colors"
                      onClick={() => setShowExperimentalMenu(false)}
                    >
                      <div className="p-2 bg-pink-100 dark:bg-pink-900/40 text-pink-600 rounded-lg shrink-0">
                        <BrainCircuit size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-foreground group-hover/item:text-pink-600 transition-colors cursor-default">Hypothesis Simulator</div>
                        <div className="text-xs text-muted-foreground mt-0.5 cursor-default">Validate connections via interactive clinical cases.</div>
                      </div>
                    </Link>

                    <div className="h-px bg-border mx-2" />

                    <Link
                      to="/molecular"
                      className="flex items-start gap-4 p-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 group/item transition-colors"
                      onClick={() => setShowExperimentalMenu(false)}
                    >
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-lg shrink-0">
                        <Dna size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-foreground group-hover/item:text-blue-600 transition-colors cursor-default">Molecular Simulator</div>
                        <div className="text-xs text-muted-foreground mt-0.5 cursor-default">Explore mechanistic pathways in a sandbox environment.</div>
                      </div>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Card 4: Hypothesis Hub */}
          <Link
            to="/hypothesis"
             className="group flex flex-col p-5 sm:p-8 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
               <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                <BrainCircuit size={32} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-purple-600 transition-colors">
                Hypothesis Hub
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Run comprehensive biomedical simulations across the PrimeKG knowledge graph to discover drug candidates, genetic targets, and environmental risk factors.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                In-Silico Simulation
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300">
                Precision Medicine
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                 Multi-Omics
              </span>
            </div>
          </Link>

        </div>
      </main>

      {/* Tech Footer */}
      <TechFooter />
    </div>
  );
}

