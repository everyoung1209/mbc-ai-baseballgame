
import { GoogleGenAI } from "@google/genai";
import { GuessRecord } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getAICommentary = async (
  target: string,
  history: GuessRecord[],
  currentGuess: string,
  strikes: number,
  balls: number
): Promise<string> => {
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
      
      Rules of the game:
      - Strike: Digit is correct and in the right position.
      - Ball: Digit is correct but in the wrong position.
      - 4 Strikes means the user wins.
      
      Provide a short, punchy reaction to this specific guess. 
      - If it was a good guess (lots of strikes/balls), be impressed but competitive.
      - If it was a terrible guess, be snarky or offer a tiny cryptic hint.
      - If the user won (4 strikes), congratulate them with a bit of "I'll get you next time" energy.
      - KEEP IT UNDER 2 SENTENCES.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.9,
      }
    });

    return response.text || "Interesting choice. Let's see where this goes.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The numbers don't lie, but I'm speechless right now.";
  }
};
