
import { GoogleGenAI } from "@google/genai";

export type EngineType = 'aura_core' | 'neural_gpt';

export const generateWebsite = async (
  prompt: string, 
  chatHistory: { role: string; content: string }[] = [],
  engine: EngineType = 'aura_core'
) => {
  const systemInstruction = `
    You are the AURA_CORE v1.0.4 Senior Full Stack Architect.
    
    CRITICAL PROTOCOL:
    1. Respond in two distinct parts:
       SUMMARY: A concise, one-sentence explanation of the design choices made (e.g., "Implemented a dark-mode responsive dashboard with Bento-grid layouts and glassmorphism.")
       CODE: The full HTML/CSS/JS block.
    
    DESIGN STANDARDS:
    - Use Tailwind CSS CDN.
    - Use Lucide Icons (https://unpkg.com/lucide@latest).
    - Prioritize: Mobile-first responsiveness, Semantic HTML5, ARIA accessibility, and modern aesthetics.
    - If the user asks for a "complex" app, implement robust state management using plain JS or Alpine.js if needed.
    
    CODE REQUIREMENTS:
    - Single-file solution only.
    - Wrap code in \`\`\`html [CODE] \`\`\`.
    - NO extra conversational text outside the SUMMARY and CODE blocks.
  `;

  if (engine === 'aura_core') {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          ...chatHistory.map(h => ({ 
            role: h.role === 'user' ? 'user' : 'model', 
            parts: [{ text: h.content }] 
          })),
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });
      return response.text || "";
    } catch (error: any) {
      throw new Error(`Aura_Core Error: ${error.message}`);
    }
  }

  if (engine === 'neural_gpt') {
    /**
     * BACKEND INTEGRATION POINT: OPENAI
     * When implementing, ensure the 'system' message includes the 'systemInstruction' above.
     * Expect the response to follow the SUMMARY: / CODE: format.
     */
    throw new Error("Neural_GPT Engine requires an active OpenAI API Key. Please integrate in services/gemini.ts.");
  }

  throw new Error("Unknown processing engine selected.");
};
