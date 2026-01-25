import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { LayoutContext } from '../components/Layout';
import { useApiKey } from '../contexts/ApiKeyContext';
import { generateResponse } from '../services/geminiService';
import { GeminiModel } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface HypothesisCase {
  id?: string;
  title: string;
  difficulty?: 'Student' | 'Resident' | 'Attending';
  description: string;
  clinical_vignette?: string;
  key_findings?: string[];
  entities: string[];
  mysteryConnection: string;
  hidden_diagnosis?: string;
}

interface EvaluationResult {
  grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  score_breakdown?: {
    accuracy: number;
    evidence_quality: number;
    reasoning_depth: number;
  };
  feedback: string;
  citations?: string[];
  grounding_links?: string[];
  best_explanation?: string;
}

export default function HypothesisGame() {
  const { darkMode } = useOutletContext<LayoutContext>();
  const [currentCase, setCurrentCase] = useState<HypothesisCase | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userHypothesis, setUserHypothesis] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const { apiKey } = useApiKey();

  // Load state from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('hypothesisGame_state');
    if (saved) {
      try {
        const { case: sCase, hypothesis: sHypo, eval: sEval } = JSON.parse(saved);
        if (sCase) {
          setCurrentCase(sCase);
          setUserHypothesis(sHypo || '');
          setEvaluation(sEval || null);
          return;
        }
      } catch (e) {
        console.error("Failed to restore state", e);
      }
    }
    // Only generate new if nothing saved
    generateNewCase();
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (currentCase) {
      localStorage.setItem('hypothesisGame_state', JSON.stringify({
        case: currentCase,
        hypothesis: userHypothesis,
        eval: evaluation
      }));
    }
  }, [currentCase, userHypothesis, evaluation]);

  const generateNewCase = async () => {
    // 1. Reset Reset UI state immediately
    setEvaluation(null);
    setUserHypothesis('');
    setCurrentCase(null); // Clear current case to show loading state
    setIsLoading(true);
    
    // 2. Clear storage
    localStorage.removeItem('hypothesisGame_state');
    
    try {
      const difficulty = ['Student', 'Resident', 'Attending'][Math.floor(Math.random() * 3)];
      
      const prompt = `Act as a Board-Certified Pathologist. Generate a "Clinical Mystery Case" for a ${difficulty} level trainee.
      Target Topics: Precision Oncology, Rare Genetic Disorders, or Pharmacogenomics.
      
      Generate a JSON object with this exact schema:
      {
        "id": "CASE_${Date.now()}",
        "title": "Medical Case Title",
        "difficulty": "${difficulty}",
        "clinical_vignette": "Detailed patient history (3-4 sentences). Include age, gender, presenting symptoms, and history.",
        "key_findings": ["Lab Result 1", "Genetic Marker", "Symptom"],
        "entities": ["Entity_A", "Entity_B"], 
        "hidden_diagnosis": "The actual condition",
        "mysteryConnection": "The biological mechanism linking Entity A and B (Internal use)."
      }
      
      Ensure the entities exist in major biomedical databases (PrimeKG/UMLS).`;

      const response = await generateResponse(prompt, [], GeminiModel.FLASH_2_0_EXP, apiKey || undefined);
      
      const text = response.text.replace(/```json|```/g, '').trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        setCurrentCase(data);
      }
    } catch (err) {
      console.error("Failed to generate case", err);
    } finally {
      setIsLoading(false);
    }
  };

  const evaluateHypothesis = async () => {
    if (!currentCase || !userHypothesis) return;
    setIsEvaluating(true);
    
    try {
      const prompt = `Act as a "Peer Reviewer 2" for a high-impact medical journal. Evaluate the student's hypothesis for Case: "${currentCase.title}".
      
      Patient Case: ${currentCase.clinical_vignette || currentCase.description}
      Key Findings: ${currentCase.key_findings?.join(', ') || 'Not specified'}
      Target Entities: ${currentCase.entities?.join(' & ') || 'Unknown'}
      Student Hypothesis: "${userHypothesis}"
      Real Mechanism (SECRET): ${currentCase.mysteryConnection}
      
      Your Goal: Verify if the student's reasoning is biologically grounded. 
      YOU MUST CITE EVIDENCE (PubMed IDs or real gene/pathway names).
      
      Return JSON ONLY:
      {
        "grade": "A" | "B" | "C" | "D" | "F",
        "score_breakdown": {
          "accuracy": 0-100,
          "evidence_quality": 0-100,
          "reasoning_depth": 0-100
        },
        "feedback": "Detailed critique. Be supportive but strict about mechanism precision.",
        "citations": ["PMID:12345", "Gene:BRAF"],
        "grounding_links": ["${currentCase.entities?.[0]}", "${currentCase.entities?.[1]}"], 
        "best_explanation": "The Gold Standard explanation of the mystery."
      }`;

      // Using Gemini 3.0 Flash (FLASH) for high-reasoning evaluation
      const response = await generateResponse(prompt, [], GeminiModel.FLASH, apiKey || undefined);
      
      const text = response.text.replace(/```json|```/g, '').trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
         const result = JSON.parse(jsonMatch[0]);
         setEvaluation(result);
      } else {
         throw new Error("Failed to parse evaluation JSON");
      }
    } catch (err) {
      console.error("Evaluation failed", err);
      // Fallback for parser error
      setEvaluation({
          grade: 'F',
          score_breakdown: { accuracy: 0, evidence_quality: 0, reasoning_depth: 0 },
          feedback: "System Error: The automated peer review system failed to parse the evaluation. Please try again.",
          citations: [],
          grounding_links: [],
          best_explanation: "Error."
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 h-full overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <span className="text-4xl">🧬</span> 
            Hypothesis Simulator <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20">Grounding Mode</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl">Validate biological connections with rigorous peer review. All hypotheses must be grounded in PrimeKG evidence.</p>
        </div>
        <button 
          onClick={generateNewCase}
          className="px-6 py-2 bg-surface hover:bg-surface-hover text-foreground rounded-lg border border-border transition-all flex items-center gap-2 group shadow-sm"
        >
          <span className={`material-symbols-outlined text-muted-foreground ${isLoading ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`}>autorenew</span>
          {isLoading ? 'Synthesizing...' : 'New Case'}
        </button>
      </div>

      {isLoading ? (
        <div className="p-20 text-center border border-dashed border-border rounded-3xl bg-surface/50">
          <div className="inline-block animate-pulse mb-6 text-indigo-400">
             <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"/>
          </div>
          <h3 className="text-xl text-foreground font-mono mb-2">Generating Clinical Vignette...</h3>
          <p className="text-tertiary text-sm">Consulting PrimeKG Ontology & PubMed Sources</p>
        </div>
      ) : currentCase ? (
        <div className="space-y-6">
          
          {/* Clinical Case File */}
          <div className="relative bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl">
            {/* Folder Tab Visual */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 opacity-50" />
            
            <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${
                                currentCase.difficulty === 'Student' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                currentCase.difficulty === 'Resident' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                                'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}>
                                Level: {currentCase.difficulty || 'Student'}
                            </span>
                            <span className="text-tertiary text-xs font-mono">ID: {currentCase.id || 'Unknown'}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">{currentCase.title}</h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Vignette */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="bg-surface-hover/50 rounded-xl p-5 border border-border/50">
                            <h3 className="text-xs font-bold text-tertiary uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">history_edu</span> Patient Vignette
                            </h3>
                            <p className="text-muted-foreground leading-relaxed font-serif text-lg">
                                {currentCase.clinical_vignette || currentCase.description}
                            </p>
                        </div>
                        
                        <div className="bg-surface-hover/50 rounded-xl p-5 border border-border/50">
                           <h3 className="text-xs font-bold text-tertiary uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">hub</span> PrimeKG Entities
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {currentCase.entities.map(e => (
                                    <span key={e} className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-sm font-mono flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-indigo-400"/> {e}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Findings Panel */}
                    <div className="bg-surface-hover rounded-xl border border-border p-5">
                         <h3 className="text-xs font-bold text-tertiary uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">labs</span> Key Findings
                        </h3>
                        <ul className="space-y-3">
                            {currentCase.key_findings?.map((finding, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground pb-3 border-b border-border/50 last:border-0">
                                    <span className="material-symbols-outlined text-amber-500 text-[18px] mt-0.5">warning</span>
                                    <span>{finding}</span>
                                </li>
                            ))}
                            {!currentCase.key_findings && <li className="text-tertiary italic">No specific lab data provided.</li>}
                        </ul>
                    </div>
                </div>
            </div>
          </div>

          {/* User Input Section */}
          {!evaluation && (
            <div className="bg-surface border border-border rounded-2xl p-8 shadow-xl">
              <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                Formulate Hypothesis
              </label>
              <textarea
                value={userHypothesis}
                onChange={(e) => setUserHypothesis(e.target.value)}
                placeholder="Explain the molecular mechanism linking the clinical presentation to the entities. Cite pathways or gene interactions if possible..."
                className={`w-full h-40 border rounded-xl p-4 focus:ring-2 focus:ring-accent outline-none resize-none mb-6 font-mono text-sm leading-relaxed
                    bg-surface-hover border-border text-foreground placeholder-tertiary
                `}
              />
              <div className="flex justify-end">
                  <button
                    onClick={evaluateHypothesis}
                    disabled={!userHypothesis || isEvaluating}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg hover:shadow-indigo-500/25 active:scale-95"
                  >
                    {isEvaluating ? (
                       <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> peer_review.exe running...</>
                    ) : (
                       <>Submit for Review <span className="material-symbols-outlined">send</span></>
                    )}
                  </button>
              </div>
            </div>
          )}

          {/* Evaluation Result */}
          {evaluation && (
            <div className="bg-surface border border-emerald-500/30 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 shadow-2xl">
              <div className="p-8 border-b border-border bg-emerald-500/5">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black border-2 shadow-inner ${
                            evaluation.grade === 'A' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' :
                            evaluation.grade === 'B' ? 'bg-blue-500/20 border-blue-500 text-blue-400' :
                            evaluation.grade === 'C' ? 'bg-amber-500/20 border-amber-500 text-amber-400' :
                            'bg-red-500/20 border-red-500 text-red-500'
                        }`}>
                            {evaluation.grade}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Peer Review Feedback</h3>
                            <p className="text-tertiary text-sm">Reviewer System v3.0 (Flash)</p>
                        </div>
                      </div>
                      
                      {/* Metrics */}
                      <div className="flex gap-6">
                          {evaluation.score_breakdown && Object.entries(evaluation.score_breakdown).map(([key, score]) => (
                              <div key={key} className="text-center">
                                  <div className="text-[10px] uppercase font-bold text-tertiary mb-1">{key.replace('_', ' ')}</div>
                                  <div className="h-2 w-24 bg-surface-hover rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${score > 80 ? 'bg-emerald-500' : score > 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${score}%` }} />
                                  </div>
                                  <div className="text-xs font-mono mt-1 text-muted-foreground">{score}/100</div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 prose prose-sm max-w-none dark:prose-invert">
                      <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">Reviewer Comments</h4>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            strong: ({node, ...props}) => <strong className="text-emerald-500 font-bold" {...props} />,
                            p: ({node, ...props}) => <p className="mb-4 text-muted-foreground leading-relaxed" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                            li: ({node, ...props}) => <li className="text-muted-foreground" {...props} />,
                            h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-foreground mb-4 mt-6" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-xl font-bold text-foreground mb-3 mt-5" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-lg font-bold text-foreground mb-2 mt-4" {...props} />,
                        }}
                      >
                        {typeof evaluation === 'string' ? evaluation : evaluation.feedback}
                      </ReactMarkdown>
                      
                      {evaluation.best_explanation && (
                          <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                              <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">Gold Standard Explanation</h4>
                              <p className="text-muted-foreground text-sm leading-relaxed">{evaluation.best_explanation}</p>
                          </div>
                      )}
                  </div>
                  
                  <div className="space-y-6">
                      {/* Citations */}
                      <div className="bg-surface-hover/50 rounded-xl p-4 border border-border">
                          <h4 className="text-xs font-bold text-tertiary uppercase tracking-widest mb-3 flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm">library_books</span> Citations
                          </h4>
                          {evaluation.citations && evaluation.citations.length > 0 ? (
                              <ul className="space-y-2">
                                  {evaluation.citations.map((cit, i) => (
                                      <li key={i}>
                                          <a 
                                            href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(cit)}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-start gap-2"
                                          >
                                              <span className="material-symbols-outlined text-[14px] mt-0.5">open_in_new</span>
                                              {cit}
                                          </a>
                                      </li>
                                  ))}
                              </ul>
                          ) : (
                              <p className="text-xs text-tertiary italic">No direct citations provided.</p>
                          )}
                      </div>

                      {/* Grounding Actions */}
                      <button
                        onClick={generateNewCase}
                        className="w-full py-3 bg-card hover:bg-accent text-card-foreground font-bold rounded-xl transition-all border border-border flex items-center justify-center gap-2 shadow-sm"
                      >
                        Next Case <span className="material-symbols-outlined">arrow_forward</span>
                      </button>
                  </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-tertiary mt-20">
            Press "New Case" to begin simulation.
        </div>
      )}
    </div>
  );
}
