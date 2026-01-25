import GeminiColor from './GeminiColor';
import GoogleCloudColor from './GoogleCloudColor';

/**
 * TechFooter - Displays technology stack logos
 * Shows Harvard, Neo4j, Docker, Google Cloud, Gemini, Python, and TypeScript logos
 * with elegant hover effects and responsive design
 */
export default function TechFooter() {
  return (
    <footer className="w-full border-t border-border bg-card/50 backdrop-blur-sm mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Powered By</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6 md:gap-8">
          <a href="https://zitniklab.hms.harvard.edu/projects/PrimeKG/" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center justify-center gap-3 p-4 rounded-xl transition-all duration-300 hover:bg-accent/50 hover:scale-105 hover:shadow-lg" aria-label="Harvard">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <img alt="Harvard University - PrimeKG" className="w-full h-full object-contain" loading="lazy" src="/harvard.png" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">Harvard</span>
          </a>
          <a href="https://neo4j.com/" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center justify-center gap-3 p-4 rounded-xl transition-all duration-300 hover:bg-accent/50 hover:scale-105 hover:shadow-lg" aria-label="Neo4j">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <img alt="Neo4j" className="w-full h-full object-contain" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/neo4j/neo4j-original.svg" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">Neo4j</span>
          </a>
          <a href="https://www.docker.com/" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center justify-center gap-3 p-4 rounded-xl transition-all duration-300 hover:bg-accent/50 hover:scale-105 hover:shadow-lg" aria-label="Docker">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <img alt="Docker" className="w-full h-full object-contain" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">Docker</span>
          </a>
          <a href="https://cloud.google.com/" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center justify-center gap-3 p-4 rounded-xl transition-all duration-300 hover:bg-accent/50 hover:scale-105 hover:shadow-lg" aria-label="Google Cloud">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <GoogleCloudColor />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">Google Cloud</span>
          </a>
          <a href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center justify-center gap-3 p-4 rounded-xl transition-all duration-300 hover:bg-accent/50 hover:scale-105 hover:shadow-lg" aria-label="Gemini">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <GeminiColor />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">Gemini</span>
          </a>
          <a href="https://www.python.org/" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center justify-center gap-3 p-4 rounded-xl transition-all duration-300 hover:bg-accent/50 hover:scale-105 hover:shadow-lg" aria-label="Python">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <img alt="Python" className="w-full h-full object-contain" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">Python</span>
          </a>
          <a href="https://www.typescriptlang.org/" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center justify-center gap-3 p-4 rounded-xl transition-all duration-300 hover:bg-accent/50 hover:scale-105 hover:shadow-lg" aria-label="TypeScript">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <img alt="TypeScript" className="w-full h-full object-contain rounded-sm" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">TypeScript</span>
          </a>
        </div>
        <div className="text-center mt-8 pt-6 border-t border-border/50">
          <p className="text-xs text-muted-foreground">© 2026 PrimeKG Bio-Lab. Hallucination-Free Biomedical AI via Graph Grounding.</p>
        </div>
      </div>
    </footer>
  );
}
