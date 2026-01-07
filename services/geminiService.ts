
import { GoogleGenAI } from "@google/genai";
import { GuessRecord } from "../types.ts";

export const getAICommentary = async (
  target: string,
  history: GuessRecord[],
  currentGuess: string,
  strikes: number,
  balls: number
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'YOUR_API_KEY') {
    return "API Key가 설정되어 있지 않습니다.";
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const historyText = history
      .map(h => `Guess: ${h.guess}, Results: ${h.strikes}S ${h.balls}B`)
      .join('\n');

    const prompt = `
      You are a witty, competitive, and slightly sarcastic "Number Baseball" Game Master.
      The secret 4-digit number is "${target}". (Unique digits 0-9).
      
      User's History:
      ${historyText || "No guesses yet."}
      
      User's Newest Guess: "${currentGuess}"
      Results for this guess: ${strikes} Strike(s), ${balls} Ball(s).
      
      Rules:
      - Strike: Correct digit and position.
      - Ball: Correct digit, wrong position.
      
      Provide a short, punchy reaction (under 2 sentences).
      - If good guess, be slightly threatened.
      - If poor guess, be witty or snarky.
      - If won (4 strikes), be impressed but ready for revenge.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.9,
      }
    });

    return response.text || "Interesting strategy.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The system encountered an anomaly in analysis.";
  }
};
