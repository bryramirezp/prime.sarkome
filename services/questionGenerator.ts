
import { GoogleGenAI } from "@google/genai";
import { GeminiModel } from '../types';

/**
 * Generates dynamic suggested questions using Gemini Flash
 * Caches results in localStorage to avoid excessive API calls
 */
export async function generateSuggestedQuestions(count: number = 4): Promise<Array<{ id: string; emoji: string; label: string; query: string; category: 'discovery' | 'mechanism' | 'visualization' | 'repurposing' }>> {
  const CACHE_KEY = 'primeai_suggested_questions';
  // Cache for 1 hour to balance variety with quota usage
  const CACHE_EXPIRY = 60 * 60 * 1000; 

  // Try to check cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        // Shuffle the cached generated questions to give variety on reloads
        return data.sort(() => 0.5 - Math.random()).slice(0, count);
      }
    }
  } catch (e) {
    // Ignore cache errors
  }

  // Get API key from storage or env
  const apiKey = localStorage.getItem('primekg_gemini_api_key') || 
                 (import.meta.env.VITE_GEMINI_API_KEY as string);
  
  if (!apiKey) return [];

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Use Flash model for speed and low cost
    const prompt = `Generate 12 unique, scientific, and specific questions about precision medicine, genetics, drugs, or diseases that a researcher might ask a knowledge graph AI.
    
    Categories:
    - 'discovery': Finding new targets or pathways
    - 'mechanism': Explaining how things work
    - 'visualization': Asking to see networks or connections
    - 'repurposing': Finding new uses for drugs

    Format as a JSON array of objects with these exact keys:
    - id: unique string
    - emoji: single relevant emoji
    - label: short snappy title (max 5 words)
    - query: detailed natural language question (max 20 words)
    - category: one of the categories above only

    Topics to mix: Oncology, Neurology, Cardiology, Rare Diseases, CRISPR, Immunotherapy, Drug Interactions.
    Make them sound professional yet curious. Example label: "CRISPR targets for HIV", query: "What genes are potential targets for CRISPR-based HIV therapies?"`;

    const result = await ai.models.generateContent({
        model: GeminiModel.FLASH,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' }
    });

    let text = "";
    if (result.candidates && result.candidates.length > 0 && result.candidates[0].content?.parts) {
      text = result.candidates[0].content.parts.map(p => p.text).join('');
    }

    if (!text) throw new Error("No text generated");
    
    const questions = JSON.parse(text);

    // Validate structure briefly
    if (!Array.isArray(questions)) return [];

    // Save to cache
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: questions,
      timestamp: Date.now()
    }));

    // Return requested amount
    return questions.slice(0, count);

  } catch (error) {
    console.warn("Failed to generate dynamic questions, falling back to static:", error);
    return []; 
  }
}
